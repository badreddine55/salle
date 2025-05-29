
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const formateurRoutes = require('./routes/formateurRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const etablissementRoutes = require('./routes/etablissementRoutes');
const filieresRoutes = require('./routes/filieresRoutes');
const groupeRoutes = require('./routes/groupeRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const path = require('path');

const whatsappRoutes = require('./routes/whatsappRoutes'); // Adjust path as needed
const { errorHandler } = require('./middleware/errorHandler');

dotenv.config();
console.log('Environment variables:', {
  MONGO_URI: process.env.MONGO_URI,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  APP_URL: process.env.APP_URL,
});

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'role'],
  credentials: true,
}));
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/formateurs', formateurRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/etablissements', etablissementRoutes);
app.use('/api/filieres', filieresRoutes);
app.use('/api/groupes', groupeRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api', uploadRoutes);
app.use(errorHandler);

module.exports = app; // Export the app instance