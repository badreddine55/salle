const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Formateur = require('../models/Formateur');
const Superadmin = require('../models/Superadmin');
const Schedule = require('../models/Schedule');

// Validation function for formateur data
const validateFormateurData = (data) => {
  const { matricule, name, email, phoneNumber, address, role } = data;
  const errors = [];

  if (!matricule) errors.push('Matricule is required');
  if (!name) errors.push('Name is required');
  if (!email) errors.push('Email is required');
  if (email && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push('Invalid email format');
  }
  if (phoneNumber && phoneNumber.length > 20) {
    errors.push('Phone number cannot exceed 20 characters');
  }
  if (address && address.length > 200) {
    errors.push('Address cannot exceed 200 characters');
  }
  if (role && !['Superadmin', 'Formateur'].includes(role)) {
    errors.push('Invalid role');
  }

  return errors;
};

// Get all formateurs with pagination and filtering
const getFormateurs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { matricule: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const formateurs = await Formateur.find(query)
    .select('-__v')
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .lean();

  const total = await Formateur.countDocuments(query);

  res.status(200).json({
    success: true,
    data: formateurs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get a single formateur by ID
const getFormateurById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error(`Invalid formateur ID: ${id}`);
    res.status(400);
    throw new Error('Invalid formateur ID');
  }

  let person = await Superadmin.findById(id).lean();
  if (!person) {
    person = await Formateur.findById(id).select('-__v').lean();
  }

  if (!person) {
    console.warn(`Formateur not found for ID: ${id}`);
    res.status(404);
    throw new Error('Formateur not found');
  }

  console.log(`Retrieved formateur with ID: ${id}`);
  res.status(200).json({
    success: true,
    data: {
      id: person._id,
      matricule: person.matricule,
      name: person.name,
      email: person.email,
      phoneNumber: person.phoneNumber,
      address: person.address,
      role: person.role,
    },
  });
});

// Create a new formateur
const createFormateur = asyncHandler(async (req, res) => {
  const errors = validateFormateurData(req.body);
  if (errors.length > 0) {
    console.error(`Validation errors in createFormateur: ${errors.join(', ')}`);
    res.status(400);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const { matricule, name, email, phoneNumber, address, role } = req.body;

  const formateurExists = await Formateur.findOne({ $or: [{ matricule }, { email }] });
  if (formateurExists) {
    console.warn(`Duplicate matricule or email: ${matricule}, ${email}`);
    res.status(400);
    throw new Error('Matricule or email already exists');
  }

  const formateur = await Formateur.create({
    matricule,
    name,
    email,
    phoneNumber,
    address,
    role: role || 'Formateur',
  });

  console.log(`Created formateur with ID: ${formateur._id}`);
  res.status(201).json({
    success: true,
    data: formateur,
  });
});

// Update a formateur
const updateFormateur = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error(`Invalid formateur ID: ${id}`);
    res.status(400);
    throw new Error('Invalid formateur ID');
  }

  const errors = validateFormateurData(req.body);
  if (errors.length > 0) {
    console.error(`Validation errors in updateFormateur: ${errors.join(', ')}`);
    res.status(400);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }

  const formateur = await Formateur.findById(id);
  if (!formateur) {
    console.warn(`Formateur not found for ID: ${id}`);
    res.status(404);
    throw new Error('Formateur not found');
  }

  const updatedFormateur = await Formateur.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  }).select('-__v');

  console.log(`Updated formateur with ID: ${id}`);
  res.status(200).json({
    success: true,
    data: updatedFormateur,
  });
});

const deleteFormateur = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.error(`Invalid formateur ID: ${id}`);
    res.status(400);
    throw new Error('Invalid formateur ID');
  }

  const formateur = await Formateur.findById(id);
  if (!formateur) {
    console.warn(`Formateur not found for ID: ${id}`);
    res.status(404);
    throw new Error('Formateur not found');
  }

  // Delete the formateur
  await formateur.deleteOne();

  // Delete all schedules associated with this formateur
  await Schedule.deleteMany({
    $or: [
      { formateur: id }, // Schedules where formateur is referenced directly
      { 'module.formateur': id }, // Schedules where formateur is referenced in module.formateur
    ],
  });

  console.log(`Deleted formateur with ID: ${id} and associated schedules`);
  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getFormateurs,
  getFormateurById,
  createFormateur,
  updateFormateur,
  deleteFormateur,
};