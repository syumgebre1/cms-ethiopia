const { User } = require('../models');
const { signAccessToken, signRefreshToken } = require('../utils/tokenUtils');

// POST /api/v1/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password, full_name, phone, national_id } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      email,
      password_hash: password,
      full_name,
      phone,
      national_id,
    });

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.status(201).json({
      message: 'Registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.is_locked) {
      return res
        .status(403)
        .json({ message: 'Account locked. Contact administrator.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      user.failed_attempts += 1;
      if (user.failed_attempts >= 5) {
        user.is_locked = true;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.failed_attempts = 0;
    await user.save();

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.json({
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/auth/me
exports.me = async (req, res) => {
  res.json({
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
      },
    },
  });
};

// PATCH /api/v1/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current and new password required' });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password_hash = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};