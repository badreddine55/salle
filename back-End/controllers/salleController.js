const Salle = require('../models/Salle');
const Etablissement = require('../models/Etablissement');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.getSalles = asyncHandler(async (req, res, next) => {
  const salles = await Salle.find().populate('etablissement', 'name');
  
  res.status(200).json({
    success: true,
    count: salles.length,
    data: salles.map(s => ({
      _id: s._id,
      name: s.name,
      etablissement: s.etablissement,
      secteur: s.secteur,
    })),
  });
});

exports.getSalle = asyncHandler(async (req, res, next) => {
  const salle = await Salle.findById(req.params.id).populate('etablissement', 'name');
  
  if (!salle) {
    return next(
      new ErrorResponse(`Salle non trouvée avec l'id ${req.params.id}`, 404)
    );
  }
  
  res.status(200).json({
    success: true,
    data: {
      _id: salle._id,
      name: salle.name,
      etablissement: salle.etablissement,
      secteur: salle.secteur,
    },
  });
});

exports.createSalle = asyncHandler(async (req, res, next) => {
  const { name, etablissement, secteur } = req.body;

  if (!etablissement) {
    return next(new ErrorResponse('L\'établissement est requis', 400));
  }

  const etab = await Etablissement.findById(etablissement);
  if (!etab) {
    return next(new ErrorResponse('Établissement invalide', 400));
  }

  const salle = await Salle.create({ name, etablissement, secteur });
  
  // Update etablissement's salles array
  etab.salles.push(salle._id);
  await etab.save();

  res.status(201).json({
    success: true,
    data: {
      _id: salle._id,
      name: salle.name,
      etablissement: salle.etablissement,
      secteur: salle.secteur,
    },
  });
});

exports.updateSalle = asyncHandler(async (req, res, next) => {
  const { name, etablissement, secteur } = req.body;

  if (etablissement) {
    const etab = await Etablissement.findById(etablissement);
    if (!etab) {
      return next(new ErrorResponse('Établissement invalide', 400));
    }
  }

  const salle = await Salle.findByIdAndUpdate(req.params.id, { name, etablissement, secteur }, {
    new: true,
    runValidators: true,
  }).populate('etablissement', 'name');
  
  if (!salle) {
    return next(
      new ErrorResponse(`Salle non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  // Update etablissement's salles array if etablissement changed
  if (etablissement && etablissement !== salle.etablissement.toString()) {
    const oldEtab = await Etablissement.findById(salle.etablissement);
    if (oldEtab) {
      oldEtab.salles = oldEtab.salles.filter(s => s.toString() !== salle._id.toString());
      await oldEtab.save();
    }
    const newEtab = await Etablissement.findById(etablissement);
    newEtab.salles.push(salle._id);
    await newEtab.save();
  }

  res.status(200).json({
    success: true,
    data: {
      _id: salle._id,
      name: salle.name,
      etablissement: salle.etablissement,
      secteur: salle.secteur,
    },
  });
});

exports.deleteSalle = asyncHandler(async (req, res, next) => {
  const salle = await Salle.findById(req.params.id);
  
  if (!salle) {
    return next(
      new ErrorResponse(`Salle non trouvée avec l'id ${req.params.id}`, 404)
    );
  }

  // Remove salle from etablissement
  const etab = await Etablissement.findById(salle.etablissement);
  if (etab) {
    etab.salles = etab.salles.filter(s => s.toString() !== salle._id.toString());
    await etab.save();
  }

  await salle.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});