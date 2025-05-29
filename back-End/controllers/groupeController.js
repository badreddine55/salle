const asyncHandler = require('express-async-handler');
const Groupe = require('../models/groupeModel');
const Filiere = require('../models/Filiere');

// @desc    Create a new groupe
// @route   POST /api/groupes
// @access  Private (Superadmin)
const createGroupe = asyncHandler(async (req, res) => {
  const { name, filiere, effectif } = req.body;

  if (!name || !filiere) {
    res.status(400);
    throw new Error('Le nom et la filière sont requis');
  }

  // Verify filiere exists
  const filiereExists = await Filiere.findById(filiere);
  if (!filiereExists) {
    res.status(404);
    throw new Error('Filière non trouvée');
  }

  // Check for duplicate groupe name
  const groupeExists = await Groupe.findOne({ name });
  if (groupeExists) {
    res.status(400);
    throw new Error('Un groupe avec ce nom existe déjà');
  }

  const groupe = await Groupe.create({
    name,
    filiere,
    effectif: effectif || 0,
  });

  res.status(201).json({
    success: true,
    data: groupe,
  });
});

// @desc    Get all groupes
// @route   GET /api/groupes
// @access  Private (Superadmin)
const getGroupes = asyncHandler(async (req, res) => {
  const { filiere } = req.query;

  const query = filiere ? { filiere } : {};
  const groupes = await Groupe.find(query).populate('filiere', 'name');

  res.status(200).json({
    success: true,
    data: groupes,
  });
});

// @desc    Get single groupe
// @route   GET /api/groupes/:id
// @access  Private (Superadmin)
const getGroupe = asyncHandler(async (req, res) => {
  const groupe = await Groupe.findById(req.params.id).populate('filiere', 'name');

  if (!groupe) {
    res.status(404);
    throw new Error('Groupe non trouvé');
  }

  res.status(200).json({
    success: true,
    data: groupe,
  });
});

// @desc    Update groupe
// @route   PUT /api/groupes/:id
// @access  Private (Superadmin)
const updateGroupe = asyncHandler(async (req, res) => {
  const { name, filiere, effectif } = req.body;

  const groupe = await Groupe.findById(req.params.id);

  if (!groupe) {
    res.status(404);
    throw new Error('Groupe non trouvé');
  }

  if (filiere) {
    const filiereExists = await Filiere.findById(filiere);
    if (!filiereExists) {
      res.status(404);
      throw new Error('Filière non trouvée');
    }
  }

  // Check for duplicate name (excluding current groupe)
  if (name && name !== groupe.name) {
    const groupeExists = await Groupe.findOne({ name });
    if (groupeExists) {
      res.status(400);
      throw new Error('Un groupe avec ce nom existe déjà');
    }
  }

  groupe.name = name || groupe.name;
  groupe.filiere = filiere || groupe.filiere;
  groupe.effectif = effectif !== undefined ? effectif : groupe.effectif;

  const updatedGroupe = await groupe.save();

  res.status(200).json({
    success: true,
    data: updatedGroupe,
  });
});

// @desc    Delete groupe
// @route   DELETE /api/groupes/:id
// @access  Private (Superadmin)
const deleteGroupe = asyncHandler(async (req, res) => {
  const groupe = await Groupe.findById(req.params.id);

  if (!groupe) {
    res.status(404);
    throw new Error('Groupe non trouvé');
  }

  await groupe.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  createGroupe,
  getGroupes,
  getGroupe,
  updateGroupe,
  deleteGroupe,
};