const { User, EmailVerification } = require('../models');
const { sendVerificationEmail } = require('../config/email');
const { Op } = require('sequelize');

const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// POST /api/v1/verify/send
exports.sendCode = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.is_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Cooldown — check if a code was sent in the last 60 seconds
    const recent = await EmailVerification.findOne({
      where: {
        user_id: user.id,
        used: false,
        createdAt: { [Op.gt]: new Date(Date.now() - 60 * 1000) },
      },
      order: [['createdAt', 'DESC']],
    });

    if (recent) {
      return res.status(429).json({
        message: 'Please wait 60 seconds before requesting a new code',
      });
    }

    const code = generateCode();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await EmailVerification.create({
      user_id: user.id,
      code,
      expires_at,
    });

    await sendVerificationEmail(user.email, code, user.full_name);

    res.json({ message: 'Verification code sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/v1/verify/confirm
exports.confirmCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Invalid code format' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.is_verified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const verification = await EmailVerification.findOne({
      where: {
        user_id: user.id,
        code,
        used: false,
        expires_at: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!verification) {
      return res.status(400).json({
        message: 'Invalid or expired code. Please request a new one.',
      });
    }

    verification.used = true;
    await verification.save();

    user.is_verified = true;
    await user.save();

    res.json({
      message: 'Email verified successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          phone: user.phone,
          national_id: user.national_id,
          avatar_url: user.avatar_url,
          is_verified: user.is_verified,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/v1/verify/status
exports.getStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      data: {
        is_verified: user.is_verified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};