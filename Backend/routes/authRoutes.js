const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @route   POST /api/auth/signup
// @desc    Register user (regular users only)
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { username, name, password } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({ success: false, msg: 'All fields are required' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });

    if (existingUser) {
      return res.status(400).json({ success: false, msg: 'Username already taken' });
    }

    const user = await User.create({
      username: username.toLowerCase().trim(),
      name: name.trim(),
      password,
      role: 'user'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        staffId: user.staffId
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, msg: 'Server error during signup' });
  }
});

// @route   POST /api/auth/signin
// @desc    Login user
// @access  Public
router.post('/signin', async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, msg: 'Please provide username and password' });
    }

    if (typeof username === 'object') {
      if (username.username) {
        username = username.username;
      } else {
        return res.status(400).json({ success: false, msg: 'Invalid username format' });
      }
    }

    username = String(username).toLowerCase().trim();

    const user = await User.findOne({ username }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, msg: 'Account deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, msg: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        staffId: user.staffId
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ success: false, msg: 'Server error during signin' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, data: user, msg: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, msg: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, msg: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, msg: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, msg: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req, res) => {
  res.json({ success: true, msg: 'Logged out successfully' });
});

// @route   POST /api/auth/create-user
// @desc    Create new user (superadmin only)
// @access  Private (superadmin only)
router.post('/create-user', protect, authorize('superadmin'), async (req, res) => {
  console.log('Create user endpoint hit');
  console.log('Request body:', req.body);
  console.log('User making request:', req.user);
  
  try {
    const { username, name, password, role, phone } = req.body;

    const allowedRoles = ['superadmin', 'doctor', 'reception', 'pharmacy', 'lab-tech'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Invalid role. Allowed: superadmin, doctor, reception, pharmacy, lab-tech' 
      });
    }

    if (!username || !name || !password) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Username, name and password are required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Username must be at least 3 characters' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Password must be at least 6 characters' 
      });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Username already taken' 
      });
    }

    const user = await User.create({
      username: username.toLowerCase().trim(),
      name: name.trim(),
      password: password,
      role: role,
      phone: phone || ''
    });

    console.log('User created successfully:', user._id);

    res.status(201).json({
      success: true,
      msg: `${role} user created successfully`,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        staffId: user.staffId,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Server error creating user: ' + error.message 
    });
  }
});

// @route   GET /api/auth/users
// @desc    Get all users (superadmin only) or filter by role
// @access  Private (superadmin only)
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    // Filter by role if provided
    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`Found ${users.length} users with role filter: ${role || 'all'}`);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/auth/doctors
// @desc    Get all doctors (for reception and others)
// @access  Private (reception, superadmin)
router.get('/doctors', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isActive: true })
      .select('name username staffId')
      .sort({ name: 1 });

    res.json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id
// @desc    Update user (superadmin only)
// @access  Private (superadmin only)
router.put('/users/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { name, phone, role, isActive } = req.body;
    const userId = req.params.id;

    if (userId === req.user.id && role && role !== 'superadmin') {
      return res.status(400).json({ 
        success: false, 
        msg: 'Cannot change your own role' 
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    res.json({
      success: true,
      msg: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id/status
// @desc    Activate/deactivate user (superadmin only)
// @access  Private (superadmin)
router.put('/users/:id/status', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    res.json({ success: true, data: user, msg: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   PUT /api/auth/users/:id/reset-password
// @desc    Reset user password (superadmin only)
// @access  Private (superadmin only)
router.put('/users/:id/reset-password', protect, authorize('superadmin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Password must be at least 6 characters' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      msg: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (superadmin only)
// @access  Private (superadmin only)
router.delete('/users/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        msg: 'Cannot delete your own account' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    await user.deleteOne();

    res.json({
      success: true,
      msg: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, msg: 'Server error' });
  }
});

// @route   GET /api/auth/lab-techs
// @desc    Get all lab technicians (for reception and others)
// @access  Private (reception, superadmin)
router.get('/lab-techs', protect, authorize('reception', 'superadmin'), async (req, res) => {
  try {
    console.log('Fetching lab technicians...');
    
    // Query for lab-tech role
    const labTechs = await User.find({ 
      role: 'lab-tech', 
      isActive: true 
    }).select('name username staffId phone isActive');
    
    console.log(`Found ${labTechs.length} lab technicians:`, labTechs.map(l => ({ name: l.name, role: l.role })));
    
    res.json({
      success: true,
      count: labTechs.length,
      data: labTechs
    });
  } catch (error) {
    console.error('Error fetching lab technicians:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Server error fetching lab technicians' 
    });
  }
});

module.exports = router;