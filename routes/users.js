const express = require('express');
const { query, validationResult } = require('express-validator');
const User = require('../models/User');
const HelpRequest = require('../models/HelpRequest');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -phone')
      .populate('rating');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error while fetching user profile' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by name or skills
// @access  Public
router.get('/search', [
  query('q').optional().isString().withMessage('Search query must be a string'),
  query('role').optional().isIn(['seeker', 'helper']).withMessage('Invalid role'),
  query('skills').optional().isString().withMessage('Skills must be a string'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, role, skills, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { 'profile.bio': { $regex: q, $options: 'i' } }
      ];
    }

    if (role) filter.role = role;
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      filter['profile.skills'] = { $in: skillsArray };
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password -email -phone')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error while searching users' });
  }
});

// @route   GET /api/users/me/requests
// @desc    Get current user's help requests
// @access  Private
router.get('/me/requests', auth, [
  query('status').optional().isIn(['open', 'in-progress', 'completed', 'cancelled']),
  query('type').optional().isIn(['requested', 'helped']).withMessage('Type must be either requested or helped'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, type = 'requested', page = 1, limit = 20 } = req.query;
    const filter = {};

    if (type === 'requested') {
      filter.requester = req.user._id;
    } else {
      filter.helper = req.user._id;
    }

    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const helpRequests = await HelpRequest.find(filter)
      .populate('requester', 'name profile.avatar rating')
      .populate('helper', 'name profile.avatar rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HelpRequest.countDocuments(filter);

    res.json({
      helpRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ message: 'Server error while fetching user requests' });
  }
});

// @route   GET /api/users/me/stats
// @desc    Get current user's statistics
// @access  Private
router.get('/me/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get requests made by user
    const requestedStats = await HelpRequest.aggregate([
      { $match: { requester: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get requests helped by user
    const helpedStats = await HelpRequest.aggregate([
      { $match: { helper: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average rating as helper
    const helperRating = await HelpRequest.aggregate([
      { $match: { helper: userId, 'rating.score': { $exists: true } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating.score' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Get recent activity
    const recentActivity = await HelpRequest.find({
      $or: [{ requester: userId }, { helper: userId }]
    })
    .populate('requester', 'name profile.avatar')
    .populate('helper', 'name profile.avatar')
    .sort({ updatedAt: -1 })
    .limit(5);

    const stats = {
      requested: {
        open: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        total: 0
      },
      helped: {
        inProgress: 0,
        completed: 0,
        total: 0
      },
      rating: {
        average: 0,
        total: 0
      },
      recentActivity
    };

    // Process requested stats
    requestedStats.forEach(stat => {
      const status = stat._id;
      const count = stat.count;
      stats.requested[status] = count;
      stats.requested.total += count;
    });

    // Process helped stats
    helpedStats.forEach(stat => {
      const status = stat._id;
      const count = stat.count;
      stats.helped[status] = count;
      stats.helped.total += count;
    });

    // Process rating stats
    if (helperRating.length > 0) {
      stats.rating.average = Math.round(helperRating[0].averageRating * 10) / 10;
      stats.rating.total = helperRating[0].totalRatings;
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
  }
});

// @route   GET /api/users/top-helpers
// @desc    Get top rated helpers
// @access  Public
router.get('/top-helpers', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topHelpers = await User.find({
      role: 'helper',
      isActive: true,
      'rating.count': { $gt: 0 }
    })
    .select('-password -email -phone')
    .sort({ 'rating.average': -1, 'rating.count': -1 })
    .limit(limit);

    res.json({ topHelpers });
  } catch (error) {
    console.error('Get top helpers error:', error);
    res.status(500).json({ message: 'Server error while fetching top helpers' });
  }
});

// @route   GET /api/users/me/notifications
// @desc    Get user notifications (simplified version)
// @access  Private
router.get('/me/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent help requests that match user's interests/skills
    const user = await User.findById(userId);
    const userSkills = user.profile.skills || [];

    let nearbyRequests = [];
    if (user.location.coordinates && user.location.coordinates[0] !== 0) {
      nearbyRequests = await HelpRequest.find({
        status: 'open',
        expiresAt: { $gt: new Date() },
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: user.location.coordinates
            },
            $maxDistance: 10000 // 10km
          }
        }
      })
      .populate('requester', 'name profile.avatar')
      .sort({ createdAt: -1 })
      .limit(5);
    }

    // Get requests where user is involved
    const myRequests = await HelpRequest.find({
      $or: [{ requester: userId }, { helper: userId }],
      status: { $in: ['in-progress', 'completed'] }
    })
    .populate('requester', 'name profile.avatar')
    .populate('helper', 'name profile.avatar')
    .sort({ updatedAt: -1 })
    .limit(5);

    const notifications = {
      nearbyRequests,
      myRequests,
      unreadCount: nearbyRequests.length + myRequests.length
    };

    res.json({ notifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
});

// @route   PUT /api/users/me/avatar
// @desc    Update user avatar (placeholder for file upload)
// @access  Private
router.put('/me/avatar', auth, async (req, res) => {
  try {
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ message: 'Avatar URL is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'profile.avatar': avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Server error while updating avatar' });
  }
});

// @route   GET /api/users/admin/stats
// @desc    Get admin statistics (admin only)
// @access  Private (Admin)
router.get('/admin/stats', auth, requireRole(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRequests = await HelpRequest.countDocuments();
    const activeRequests = await HelpRequest.countDocuments({ status: 'open' });
    const completedRequests = await HelpRequest.countDocuments({ status: 'completed' });

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('-password');

    const recentRequests = await HelpRequest.find()
      .populate('requester', 'name')
      .populate('helper', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const stats = {
      totalUsers,
      totalRequests,
      activeRequests,
      completedRequests,
      completionRate: totalRequests > 0 ? (completedRequests / totalRequests * 100).toFixed(1) : 0,
      recentUsers,
      recentRequests
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error while fetching admin statistics' });
  }
});

module.exports = router; 