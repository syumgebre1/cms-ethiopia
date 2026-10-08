const { User } = require('../models');

// POST /api/v1/admin/users
exports.createUser = async (req, res) => {
  try {
    const { email, password, full_name, phone, national_id, role } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['officer', 'detective', 'admin'].includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Must be officer, detective, or admin',
      });
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
      role,
      is_verified: true,
    });

    res.status(201).json({
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/admin/users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id',
        'email',
        'full_name',
        'phone',
        'role',
        'is_verified',
        'is_locked',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ data: { users } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_locked, is_verified } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role) {
      if (!['citizen', 'officer', 'detective', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = role;
    }
    if (typeof is_locked === 'boolean') user.is_locked = is_locked;
    if (typeof is_verified === 'boolean') user.is_verified = is_verified;

    await user.save();
    res.json({ message: 'User updated', data: { user } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/v1/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/v1/admin/users/:id/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password_hash = newPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};