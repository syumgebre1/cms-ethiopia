require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// ==================== Middleware ====================
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ==================== Routes ====================
app.get('/api/v1/health', (req, res) =>
  res.json({ ok: true, time: new Date() })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);

// ==================== 404 ====================
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ==================== Error Handler ====================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// ==================== Start Server ====================
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    app.listen(PORT, () => {
      console.log(`🚀 Server on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
})();