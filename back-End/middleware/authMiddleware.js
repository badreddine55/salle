const jwt = require('jsonwebtoken');
const Superadmin = require('../models/Superadmin');
const Formateur = require('../models/Formateur');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let user =
        (await Superadmin.findById(decoded.id)) ||
        (await Formateur.findById(decoded.id));

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, formateur not found' });
      }

      req.user = user;
      const headerRole = req.headers.role?.toLowerCase();
      if (headerRole && ['superadmin', 'formateur'].includes(headerRole)) {
        req.user.role = headerRole;
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const restrictTo = (...roles) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, no user' });
    }

    const userRole = req.user.role?.toLowerCase();
    if (!userRole) {
      return res.status(401).json({ message: 'Not authorized, no user role' });
    }

    const allowedRoles = roles.map(role => role.toLowerCase());
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Accès refusé. Requiert l'un des rôles suivants : ${allowedRoles.join(', ')}`,
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { protect, restrictTo };