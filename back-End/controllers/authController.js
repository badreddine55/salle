const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Auth = require('../models/Auth');
const Superadmin = require('../models/Superadmin');
const Formateur = require('../models/Formateur');
const generateToken = require('../utils/generateToken');

const findPersonById = async (id, selectPassword = false) => {
  const superadmin = await Superadmin.findById(id).select(selectPassword ? '+password' : '');
  if (superadmin) return superadmin;
  return await Formateur.findById(id);
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check Superadmin first
    let user = await Superadmin.findOne({ email }).select('+password');
    let role, id;

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      role = user.role;
      id = user._id;
    } else {
      // Fallback to Auth for Formateur
      const auth = await Auth.findOne({ email })
        .select('+password')
        .populate('id_person');
      if (!auth || !auth.id_person) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const isMatch = await bcrypt.compare(password, auth.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      role = auth.id_person.role;
      id = auth.id_person._id;
    }

    const token = generateToken(id);
    res.json({ token, role });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    let user = await Superadmin.findOne({ email });
    let model = Superadmin;
    let isSuperadmin = true;

    if (!user) {
      const auth = await Auth.findOne({ email }).populate('id_person');
      if (!auth || !auth.id_person) {
        return res.status(404).json({ message: 'User not found' });
      }
      user = auth;
      model = Auth;
      isSuperadmin = false;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.APP_URL}/api/auth/reset-password/${resetToken}`;
    const mailOptions = {
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) requested a password reset.\n\n
        Click the following link or paste it into your browser to reset your password:\n\n
        ${resetUrl}\n\n
        If you did not request this, please ignore this email.\n`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Error in forgetPassword:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    let user = await Superadmin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    let model = Superadmin;
    let isSuperadmin = true;

    if (!user) {
      user = await Auth.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
      }).select('+password');
      model = Auth;
      isSuperadmin = false;
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = password; // Will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const person = await findPersonById(decoded.id);

    if (!person) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      user: {
        id: person._id,
        name: person.name,
        email: person.email,
        phoneNumber: person.phoneNumber,
        address: person.address,
        role: person.role,
      },
    });
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const person = await findPersonById(decoded.id);

    if (!person) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, phoneNumber, address } = req.body;

    if (email && email !== person.email) {
      const existingSuperadmin = await Superadmin.findOne({ email });
      const existingAuth = await Auth.findOne({ email });
      if (existingSuperadmin || existingAuth) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    person.name = name || person.name;
    person.email = email || person.email;
    person.phoneNumber = phoneNumber || person.phoneNumber;
    person.address = address || person.address;

    if (email && email !== person.email && person.role === 'Formateur') {
      const auth = await Auth.findOne({ id_person: person._id });
      if (auth) {
        auth.email = email;
        await auth.save();
      }
    }

    await person.save();

    res.json({
      success: true,
      user: {
        id: person._id,
        name: person.name,
        email: person.email,
        phoneNumber: person.phoneNumber,
        address: person.address,
        role: person.role,
      },
    });
  } catch (error) {
    console.error('Error in updateMe:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const person = await findPersonById(decoded.id, true);

    if (!person) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    let isMatch;
    if (person.role === 'Superadmin') {
      isMatch = await bcrypt.compare(currentPassword, person.password);
    } else {
      const auth = await Auth.findOne({ id_person: person._id }).select('+password');
      if (!auth) {
        return res.status(400).json({ message: 'Auth record not found' });
      }
      isMatch = await bcrypt.compare(currentPassword, auth.password);
    }

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    if (person.role === 'Superadmin') {
      person.password = newPassword; // Will be hashed by pre-save hook
      await person.save();
    } else {
      const auth = await Auth.findOne({ id_person: person._id }).select('+password');
      auth.password = newPassword; // Will be hashed by pre-save hook
      await auth.save();
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  login,
  forgetPassword,
  resetPassword,
  getMe,
  updateMe,
  changePassword,
};