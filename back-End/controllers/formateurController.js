const Superadmin = require('../models/Superadmin');
const Formateur = require('../models/Formateur');

// @desc    Create a new formateur
// @route   POST /api/formateurs
// @access  Private
const createFormateur = async (req, res) => {
  const { name, email, phoneNumber, address, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Les champs nom, email et rôle sont requis.' });
  }

  if (!['Superadmin', 'Formateur'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide. Doit être Superadmin ou Formateur.' });
  }

  try {
    // Check for existing email in both models
    const existingFormateur = await Formateur.findOne({ email });
    const existingSuperadmin = await Superadmin.findOne({ email });
    if (existingFormateur || existingSuperadmin) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Create person (Superadmin or Formateur)
    const PersonModel = role === 'Superadmin' ? Superadmin : Formateur;
    const person = await PersonModel.create({
      name,
      email,
      phoneNumber,
      address,
      role,
    });

    res.status(201).json({
      id: person._id,
      name,
      email,
      phoneNumber,
      address,
      role,
    });
  } catch (error) {
    console.error('Error in createFormateur:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Get all formateurs
// @route   GET /api/formateurs
// @access  Private
const getAllFormateurs = async (req, res) => {
  try {
    const formateurs = await Formateur.find();
    const superadmins = await Superadmin.find();
    const allFormateurs = [
      ...formateurs.map(f => ({
        id: f._id,
        name: f.name,
        email: f.email,
        phoneNumber: f.phoneNumber,
        address: f.address,
        role: f.role,
      })),
      ...superadmins.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        phoneNumber: s.phoneNumber,
        address: s.address,
        role: s.role,
      })),
    ];

    res.json(allFormateurs);
  } catch (error) {
    console.error('Error in getAllFormateurs:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Get single formateur by ID
// @route   GET /api/formateurs/:id
// @access  Private
const getFormateurById = async (req, res) => {
  const { id } = req.params;

  try {
    let person = await Superadmin.findById(id);
    if (!person) {
      person = await Formateur.findById(id);
    }

    if (!person) {
      return res.status(404).json({ message: 'Formateur non trouvé.' });
    }

    res.json({
      id: person._id,
      name: person.name,
      email: person.email,
      phoneNumber: person.phoneNumber,
      address: person.address,
      role: person.role,
    });
  } catch (error) {
    console.error('Error in getFormateurById:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Update formateur
// @route   PUT /api/formateurs/:id
// @access  Private
const updateFormateur = async (req, res) => {
  const { id } = req.params;
  const { name, email, phoneNumber, address, role } = req.body;

  if (role && !['Superadmin', 'Formateur'].includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide. Doit être Superadmin ou Formateur.' });
  }

  try {
    let person = await Superadmin.findById(id);
    let PersonModel = Superadmin;
    if (!person) {
      person = await Formateur.findById(id);
      PersonModel = Formateur;
    }

    if (!person) {
      return res.status(404).json({ message: 'Formateur non trouvé.' });
    }

    // Check if email is being changed and already exists
    if (email && email !== person.email) {
      const existingFormateur = await Formateur.findOne({ email });
      const existingSuperadmin = await Superadmin.findOne({ email });
      if (existingFormateur || existingSuperadmin) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
      }
    }

    // If role is changing, create new person in the appropriate model
    if (role && role !== person.role) {
      const newPersonData = {
        name: name || person.name,
        email: email || person.email,
        phoneNumber: phoneNumber || person.phoneNumber,
        address: address || person.address,
        role,
      };

      await person.deleteOne();
      const NewPersonModel = role === 'Superadmin' ? Superadmin : Formateur;
      person = await NewPersonModel.create(newPersonData);
    } else {
      // Update existing person fields
      person.name = name || person.name;
      person.email = email || person.email;
      person.phoneNumber = phoneNumber || person.phoneNumber;
      person.address = address || person.address;
      await person.save();
    }

    res.json({
      id: person._id,
      name: person.name,
      email: person.email,
      phoneNumber: person.phoneNumber,
      address: person.address,
      role: person.role,
    });
  } catch (error) {
    console.error('Error in updateFormateur:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// @desc    Delete formateur
// @route   DELETE /api/formateurs/:id
// @access  Private
const deleteFormateur = async (req, res) => {
  const { id } = req.params;

  try {
    let person = await Superadmin.findById(id);
    if (!person) {
      person = await Formateur.findById(id);
    }

    if (!person) {
      return res.status(404).json({ message: 'Formateur non trouvé.' });
    }

    await person.deleteOne();

    res.json({ message: 'Formateur supprimé avec succès.' });
  } catch (error) {
    console.error('Error in deleteFormateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = {
  createFormateur,
  getAllFormateurs,
  getFormateurById,
  updateFormateur,
  deleteFormateur,
};