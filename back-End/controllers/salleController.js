const Salle = require('../models/Salle');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Obtenir toutes les salles
// @route   GET /api/v1/salles
// @access  Public
exports.getSalles = asyncHandler(async (req, res, next) => {
  const salles = await Salle.find();
  
  res.status(200).json({
    success: true,
    count: salles.length,
    data: salles
  });
});

// @desc    Obtenir une seule salle
// @route   GET /api/v1/salles/:id
// @access  Public
exports.getSalle = asyncHandler(async (req, res, next) => {
  const salle = await Salle.findById(req.params.id);
  
  if (!salle) {
    return next(
      new ErrorResponse(`Salle non trouvée avec l'id ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: salle
  });
});

// @desc    Créer une nouvelle salle
// @route   POST /api/v1/salles
// @access  Privé
exports.createSalle = asyncHandler(async (req, res, next) => {
  const salle = await Salle.create(req.body);
  
  res.status(201).json({
    success: true,
    data: salle
  });
});

// @desc    Mettre à jour une salle
// @route   PUT /api/v1/salles/:id
// @access  Privé
exports.updateSalle = asyncHandler(async (req, res, next) => {
  const salle = await Salle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!salle) {
    return next(
      new ErrorResponse(`Salle non trouvée avec l'id ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: salle
  });
});

// @desc    Supprimer une salle
// @route   DELETE /api/v1/salles/:id
// @access  Privé
exports.deleteSalle = asyncHandler(async (req, res, next) => {
  const salle = await Salle.findByIdAndDelete(req.params.id);
  
  if (!salle) {
    return next(
      new ErrorResponse(`Salle non trouvée avec l'id ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});