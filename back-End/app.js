const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const formateurRoutes = require('./routes/formateurRoutes');
const salleRoutes = require('./routes/salleRoutes');
const scheduleRoutes = require('./routes/schedule');
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
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/formateurs', formateurRoutes);
app.use('/api/salles', salleRoutes);
app.use('/api/schedule', scheduleRoutes);

app.use(errorHandler);

module.exports = app;