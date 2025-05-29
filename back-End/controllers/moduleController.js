
const Module = require('../models/Module');
const Formateur = require('../models/Formateur');
const Groupe = require('../models/groupeModel');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const getModules = asyncHandler(async (req, res, next) => {
  const modules = await Module.find().populate([
    { path: 'filiere', select: 'name' },
    { path: 'formateur', select: 'name' },
  ]);

  res.status(200).json({
    success: true,
    count: modules.length,
    data: modules.map(m => ({
      _id: m._id,
      name: m.name,
      filiere: m.filiere ? { _id: m.filiere._id, name: m.filiere.name } : null,
      formateur: m.formateur ? { _id: m.formateur._id, name: m.formateur.name } : null,
      mode: m.mode,
    })),
  });
});

const getModule = asyncHandler(async (req, res, next) => {
  const module = await Module.findById(req.params.id).populate([
    { path: 'filiere', select: 'name' },
    { path: 'formateur', select: 'name' },
  ]);

  if (!module) {
    return next(
      new ErrorResponse(`Module non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      _id: module._id,
      name: module.name,
      filiere: module.filiere ? { _id: module.filiere._id, name: module.filiere.name } : null,
      formateur: module.formateur ? { _id: module.formateur._id, name: module.formateur.name } : null,
      mode: module.mode,
    },
  });
});

const createModule = asyncHandler(async (req, res, next) => {
  const { name, filiere, formateur, mode } = req.body;

  if (!name || !filiere || !formateur) {
    return next(new ErrorResponse('Le nom, la filière et le formateur sont requis', 400));
  }

  const form = await Formateur.findById(formateur);
  if (!form || form.role !== 'Formateur') {
    return next(new ErrorResponse('Formateur invalide', 400));
  }

  const module = await Module.create({ name, filiere, formateur, mode });

  const populatedModule = await Module.findById(module._id).populate([
    { path: 'filiere', select: 'name' },
    { path: 'formateur', select: 'name' },
  ]);

  res.status(201).json({
    success: true,
    data: {
      _id: populatedModule._id,
      name: populatedModule.name,
      filiere: populatedModule.filiere ? { _id: populatedModule.filiere._id, name: populatedModule.filiere.name } : null,
      formateur: populatedModule.formateur ? { _id: populatedModule.formateur._id, name: populatedModule.formateur.name } : null,
      mode: populatedModule.mode,
    },
  });
});

const updateModule = asyncHandler(async (req, res, next) => {
  const { name, filiere, formateur, mode } = req.body;

  if (formateur) {
    const form = await Formateur.findById(formateur);
    if (!form || form.role !== 'Formateur') {
      return next(new ErrorResponse('Formateur invalide', 400));
    }
  }

  const module = await Module.findByIdAndUpdate(
    req.params.id,
    { name, filiere, formateur, mode },
    {
      new: true,
      runValidators: true,
    }
  ).populate([
    { path: 'filiere', select: 'name' },
    { path: 'formateur', select: 'name' },
  ]);

  if (!module) {
    return next(
      new ErrorResponse(`Module non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      _id: module._id,
      name: module.name,
      filiere: module.filiere ? { _id: module.filiere._id, name: module.filiere.name } : null,
      formateur: module.formateur ? { _id: module.formateur._id, name: module.formateur.name } : null,
      mode: module.mode,
    },
  });
});

const deleteModule = asyncHandler(async (req, res, next) => {
  const module = await Module.findById(req.params.id);

  if (!module) {
    return next(
      new ErrorResponse(`Module non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  // Remove module from groupes
  const groupes = await Groupe.find({ modules: module._id });
  for (const groupe of groupes) {
    groupe.modules = groupe.modules.filter(m => m.toString() !== module._id.toString());
    await groupe.save();
  }

  await module.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getModules,
  getModule,
  createModule,
  updateModule,
  deleteModule,
};
