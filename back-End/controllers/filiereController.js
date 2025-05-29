const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const Filiere = require('../models/Filiere');
const Module = require('../models/Module');
const Groupe = require('../models/groupeModel');

// Create a new filiere
const createFiliere = asyncHandler(async (req, res) => {
  const { name, groups, modules, etablissement } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400);
    throw new Error('Le nom de la filière est requis');
  }
  if (!mongoose.Types.ObjectId.isValid(etablissement)) {
    res.status(400);
    throw new Error("Identifiant d'établissement invalide");
  }

  // Validate groups
  if (groups && !Array.isArray(groups)) {
    res.status(400);
    throw new Error('Les groupes doivent être un tableau');
  }

  // Validate modules
  if (modules && !Array.isArray(modules)) {
    res.status(400);
    throw new Error('Les modules doivent être un tableau');
  }

  // Check for duplicate filiere name
  const existingFiliere = await Filiere.findOne({ name: name.trim() });
  if (existingFiliere) {
    res.status(400);
    throw new Error('Une filière avec ce nom existe déjà');
  }

  // Validate group names for uniqueness
  if (groups && groups.length > 0) {
    const groupNames = groups.map((g) => g.name);
    const existingGroups = await Groupe.find({ name: { $in: groupNames } });
    if (existingGroups.length > 0) {
      const duplicateNames = existingGroups.map((g) => g.name);
      res.status(400);
      throw new Error(`Les groupes suivants existent déjà : ${duplicateNames.join(', ')}`);
    }
  }

  // Create filiere
  const filiere = await Filiere.create({
    name: name.trim(),
    groups: groups || [],
    modules: modules || [],
    etablissement,
  });

  // Bulk create groups
  if (groups && groups.length > 0) {
    const groupDocs = groups.map((group) => ({
      name: group.name,
      filiere: filiere._id,
      effectif: 0,
    }));
    await Groupe.insertMany(groupDocs);
  }

  // Bulk create modules
  if (modules && modules.length > 0) {
    const moduleDocs = modules.map((module) => ({
      name: module.name,
      filiere: filiere._id,
    }));
    await Module.insertMany(moduleDocs);
  }

  res.status(201).json({
    success: true,
    data: filiere,
  });
});

// Get all filieres
const getFilieres = asyncHandler(async (req, res) => {
  const filieres = await Filiere.find().populate('etablissement', 'name');
  res.status(200).json({
    success: true,
    data: filieres,
  });
});

// Get a single filiere
const getFiliere = asyncHandler(async (req, res) => {
  const filiere = await Filiere.findById(req.params.id).populate('etablissement', 'name');
  if (!filiere) {
    res.status(404);
    throw new Error('Filière non trouvée');
  }
  res.status(200).json({
    success: true,
    data: filiere,
  });
});

// Update a filiere
const updateFiliere = asyncHandler(async (req, res) => {
  const { name, groups, modules, etablissement } = req.body;

  // Validate required fields
  if (!name || typeof name !== 'string' || name.trim() === '') {
    res.status(400);
    throw new Error('Le nom de la filière est requis');
  }
  if (!mongoose.Types.ObjectId.isValid(etablissement)) {
    res.status(400);
    throw new Error("Identifiant d'établissement invalide");
  }

  // Find existing filiere
  const filiere = await Filiere.findById(req.params.id);
  if (!filiere) {
    res.status(404);
    throw new Error('Filière non trouvée');
  }

  // Check for duplicate filiere name (excluding current filiere)
  const existingFiliere = await Filiere.findOne({ name: name.trim(), _id: { $ne: req.params.id } });
  if (existingFiliere) {
    res.status(400);
    throw new Error('Une filière avec ce nom existe déjà');
  }

  // Validate group names for uniqueness in other filieres
  if (groups && groups.length > 0) {
    const groupNames = groups.map((g) => g.name);
    const existingGroups = await Groupe.find({
      name: { $in: groupNames },
      filiere: { $ne: filiere._id },
    });
    if (existingGroups.length > 0) {
      const duplicateNames = existingGroups.map((g) => g.name);
      const conflictingFiliere = await Filiere.findById(existingGroups[0].filiere).select('name');
      res.status(400);
      throw new Error(
        `Les groupes suivants existent déjà dans la filière "${conflictingFiliere.name}": ${duplicateNames.join(', ')}`
      );
    }
  }

  // Update filiere
  filiere.name = name.trim();
  filiere.groups = groups || [];
  filiere.modules = modules || [];
  filiere.etablissement = etablissement;
  await filiere.save();

  // Sync groups
  const existingGroups = await Groupe.find({ filiere: filiere._id });
  const currentGroupNames = groups ? groups.map((g) => g.name) : [];

  // Delete removed groups
  await Groupe.deleteMany({
    filiere: filiere._id,
    name: { $nin: currentGroupNames },
  });

  // Bulk upsert groups
  if (groups && groups.length > 0) {
    const groupDocs = groups.map((group) => ({
      updateOne: {
        filter: { filiere: filiere._id, name: group.name },
        update: { $set: { name: group.name, effectif: 0 } },
        upsert: true,
      },
    }));
    await Groupe.bulkWrite(groupDocs);
  }

  // Sync modules
  const existingModules = await Module.find({ filiere: filiere._id });
  const currentModuleNames = modules ? modules.map((m) => m.name) : [];

  // Delete removed modules
  await Module.deleteMany({
    filiere: filiere._id,
    name: { $nin: currentModuleNames },
  });

  // Bulk upsert modules
  if (modules && modules.length > 0) {
    const moduleDocs = modules.map((module) => ({
      updateOne: {
        filter: { filiere: filiere._id, name: module.name },
        update: { $set: { name: module.name } },
        upsert: true,
      },
    }));
    await Module.bulkWrite(moduleDocs);
  }

  res.status(200).json({
    success: true,
    data: filiere,
  });
});

// Delete a filiere
const deleteFiliere = asyncHandler(async (req, res) => {
  const filiere = await Filiere.findById(req.params.id);
  if (!filiere) {
    res.status(404);
    throw new Error('Filière non trouvée');
  }

  // Delete associated groups and modules
  await Groupe.deleteMany({ filiere: filiere._id });
  await Module.deleteMany({ filiere: filiere._id });
  await filiere.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  createFiliere,
  getFilieres,
  getFiliere,
  updateFiliere,
  deleteFiliere,
};