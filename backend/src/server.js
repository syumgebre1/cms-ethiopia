require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');

const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

app.set('io', io);

// ==================== Middleware ====================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// ==================== Static uploads ====================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== Routes ====================
app.get('/api/v1/health', (req, res) =>
  res.json({ ok: true, time: new Date() })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/messages', messageRoutes);

// ==================== 404 + Error ====================
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// ==================== Start ====================
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected');

    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    setupSocket(io);

    server.listen(PORT, () => {
      console.log(`🚀 Server on http://localhost:${PORT}`);
      console.log(`   Health: http://localhost:${PORT}/api/v1/health`);
      console.log(`   Socket.IO: ready`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  }
})();