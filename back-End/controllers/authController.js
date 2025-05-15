const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Auth = require('../models/Auth');
const Superadmin = require('../models/Superadmin');
const Formateur = require('../models/Formateur');
const generateToken = require('../utils/generateToken');

const findPersonById = async (id) => {
  return (await Superadmin.findById(id)) || (await Formateur.findById(id));
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const auth = await Auth.findOne({ email }).select('+password').populate('id_person');
    if (!auth || !auth.id_person) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, auth.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(auth.id_person._id);
    const role = auth.id_person.role;

    res.json({ token, role });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const auth = await Auth.findOne({ email }).populate('id_person');
    if (!auth || !auth.id_person) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    auth.resetPasswordToken = hashedResetToken;
    auth.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await auth.save();

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
    const auth = await Auth.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!auth) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    auth.password = password; // Will be hashed by pre-save hook
    auth.resetPasswordToken = undefined;
    auth.resetPasswordExpires = undefined;

    await auth.save();
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
      const existingAuth = await Auth.findOne({ email });
      if (existingAuth) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    person.name = name || person.name;
    person.email = email || person.email;
    person.phoneNumber = phoneNumber || person.phoneNumber;
    person.address = address || person.address;

    if (email && email !== person.email) {
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
    const person = await findPersonById(decoded.id);

    if (!person) {
      return res.status(404).json({ message: 'User not found' });
    }

    const auth = await Auth.findOne({ id_person: person._id }).select('+password');
    if (!auth) {
      return res.status(400).json({ message: 'Auth record not found' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }

    const isMatch = await bcrypt.compare(currentPassword, auth.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    auth.password = newPassword; // Will be hashed by pre-save hook
    await auth.save();

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