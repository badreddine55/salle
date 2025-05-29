const Etablissement = require('../models/Etablissement');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.getEtablissements = asyncHandler(async (req, res, next) => {
  const etablissements = await Etablissement.find();
  
  res.status(200).json({
    success: true,
    count: etablissements.length,
    data: etablissements.map(e => ({
      _id: e._id,
      name: e.name,
      salles: e.salles,
    })),
  });
});

exports.getEtablissement = asyncHandler(async (req, res, next) => {
  const etablissement = await Etablissement.findById(req.params.id);
  
  if (!etablissement) {
    return next(
      new ErrorResponse(`Établissement non trouvé avec l'id ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: {
      _id: etablissement._id,
      name: etablissement.name,
      salles: etablissement.salles,
    },
  });
});

exports.createEtablissement = asyncHandler(async (req, res, next) => {
  const { name, salles } = req.body;

  if (!name || !name.trim()) {
    return next(new ErrorResponse('Le nom de l\'établissement est requis', 400));
  }

  // Validate salles (optional, ensure they are strings)
  if (salles) {
    if (!Array.isArray(salles) || salles.some(s => typeof s !== 'string' || !s.trim())) {
      return next(new ErrorResponse('Les salles doivent être une liste de noms valides', 400));
    }
  }

  const etablissement = await Etablissement.create({ name, salles: salles || [] });
  
  res.status(201).json({
    success: true,
    data: {
      _id: etablissement._id,
      name: etablissement.name,
      salles: etablissement.salles,
    },
  });
});

exports.updateEtablissement = asyncHandler(async (req, res, next) => {
  const { name, salles } = req.body;

  if (!name || !name.trim()) {
    return next(new ErrorResponse('Le nom de l\'établissement est requis', 400));
  }

  // Validate salles (optional, ensure they are strings)
  if (salles) {
    if (!Array.isArray(salles) || salles.some(s => typeof s !== 'string' || !s.trim())) {
      return next(new ErrorResponse('Les salles doivent être une liste de noms valides', 400));
    }
  }

  const etablissement = await Etablissement.findByIdAndUpdate(
    req.params.id,
    { name, salles: salles || [] },
    {
      new: true,
      runValidators: true,
    }
  );
  
  if (!etablissement) {
    return next(
      new ErrorResponse(`Établissement non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {
      _id: etablissement._id,
      name: etablissement.name,
      salles: etablissement.salles,
    },
  });
});

exports.deleteEtablissement = asyncHandler(async (req, res, next) => {
  const etablissement = await Etablissement.findById(req.params.id);
  
  if (!etablissement) {
    return next(
      new ErrorResponse(`Établissement non trouvé avec l'id ${req.params.id}`, 404)
    );
  }

  await etablissement.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});