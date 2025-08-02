const express = require('express');
const { body, validationResult, query } = require('express-validator');
const HelpRequest = require('../models/HelpRequest');
const Chat = require('../models/Chat');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/help-requests
// @desc    Create a new help request
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
  body('category').isIn(['food', 'education', 'medical', 'elderly-care', 'emergency', 'transportation', 'household', 'other']).withMessage('Invalid category'),
  body('urgency').isIn(['low', 'medium', 'high']).withMessage('Invalid urgency level'),
  body('coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array with 2 elements'),
  body('address').optional().isString().withMessage('Address must be a string'),
  body('city').optional().isString().withMessage('City must be a string'),
  body('state').optional().isString().withMessage('State must be a string'),
  body('zipCode').optional().isString().withMessage('Zip code must be a string'),
  body('contactPreference').optional().isIn(['chat', 'phone', 'email']).withMessage('Invalid contact preference'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      category,
      urgency,
      coordinates,
      address,
      city,
      state,
      zipCode,
      contactPreference,
      isAnonymous,
      tags,
      images
    } = req.body;

    const helpRequest = new HelpRequest({
      title,
      description,
      category,
      urgency,
      requester: req.user._id,
      location: {
        type: 'Point',
        coordinates,
        address,
        city,
        state,
        zipCode
      },
      contactPreference: contactPreference || 'chat',
      isAnonymous: isAnonymous || false,
      tags: tags || [],
      images: images || []
    });

    await helpRequest.save();

    // Populate requester info
    await helpRequest.populate('requester', 'name profile.avatar rating');

    res.status(201).json({
      message: 'Help request created successfully',
      helpRequest
    });
  } catch (error) {
    console.error('Create help request error:', error);
    res.status(500).json({ message: 'Server error during help request creation' });
  }
});

// @route   GET /api/help-requests
// @desc    Get help requests with filters
// @access  Public (with optional auth)
router.get('/', optionalAuth, [
  query('category').optional().isIn(['food', 'education', 'medical', 'elderly-care', 'emergency', 'transportation', 'household', 'other']),
  query('urgency').optional().isIn(['low', 'medium', 'high']),
  query('status').optional().isIn(['open', 'in-progress', 'completed', 'cancelled']),
  query('latitude').optional().isFloat(),
  query('longitude').optional().isFloat(),
  query('radius').optional().isFloat(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      category,
      urgency,
      status = 'open',
      latitude,
      longitude,
      radius = 10000,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { status };

    if (category) filter.category = category;
    if (urgency) filter.urgency = urgency;

    // Add location filter if coordinates provided
    if (latitude && longitude) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(radius)
        }
      };
    }

    // Add expiry filter for open requests
    if (status === 'open') {
      filter.expiresAt = { $gt: new Date() };
    }

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
    console.error('Get help requests error:', error);
    res.status(500).json({ message: 'Server error while fetching help requests' });
  }
});

// @route   GET /api/help-requests/nearby
// @desc    Get nearby help requests
// @access  Public
router.get('/nearby', [
  query('latitude').isFloat().withMessage('Latitude is required and must be a number'),
  query('longitude').isFloat().withMessage('Longitude is required and must be a number'),
  query('maxDistance').optional().isFloat().withMessage('Max distance must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { latitude, longitude, maxDistance = 10000 } = req.query;
    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    const helpRequests = await HelpRequest.findNearby(coordinates, parseFloat(maxDistance));

    res.json({
      helpRequests,
      userLocation: { latitude, longitude }
    });
  } catch (error) {
    console.error('Get nearby requests error:', error);
    res.status(500).json({ message: 'Server error while fetching nearby requests' });
  }
});

// @route   GET /api/help-requests/:id
// @desc    Get a specific help request
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id)
      .populate('requester', 'name profile.avatar rating')
      .populate('helper', 'name profile.avatar rating');

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    res.json({ helpRequest });
  } catch (error) {
    console.error('Get help request error:', error);
    res.status(500).json({ message: 'Server error while fetching help request' });
  }
});

// @route   PUT /api/help-requests/:id/accept
// @desc    Accept a help request
// @access  Private
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    if (!helpRequest.canBeAccepted()) {
      return res.status(400).json({ message: 'Help request cannot be accepted' });
    }

    if (helpRequest.requester.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot accept your own help request' });
    }

    await helpRequest.acceptRequest(req.user._id);

    // Create or get chat between users
    const chat = await Chat.findOrCreateChat(
      [helpRequest.requester, req.user._id],
      helpRequest._id
    );

    // Populate the updated help request
    await helpRequest.populate('requester', 'name profile.avatar rating');
    await helpRequest.populate('helper', 'name profile.avatar rating');

    res.json({
      message: 'Help request accepted successfully',
      helpRequest,
      chat
    });
  } catch (error) {
    console.error('Accept help request error:', error);
    res.status(500).json({ message: 'Server error while accepting help request' });
  }
});

// @route   PUT /api/help-requests/:id/complete
// @desc    Complete a help request
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    // Only the helper or requester can complete the request
    if (helpRequest.helper.toString() !== req.user._id.toString() && 
        helpRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to complete this request' });
    }

    await helpRequest.completeRequest();

    // Populate the updated help request
    await helpRequest.populate('requester', 'name profile.avatar rating');
    await helpRequest.populate('helper', 'name profile.avatar rating');

    res.json({
      message: 'Help request completed successfully',
      helpRequest
    });
  } catch (error) {
    console.error('Complete help request error:', error);
    res.status(500).json({ message: 'Server error while completing help request' });
  }
});

// @route   PUT /api/help-requests/:id/rate
// @desc    Rate a completed help request
// @access  Private
router.put('/:id/rate', auth, [
  body('score').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isLength({ max: 500 }).withMessage('Feedback must be less than 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { score, feedback } = req.body;
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    if (helpRequest.status !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed requests' });
    }

    // Only the requester can rate the helper
    if (helpRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the requester can rate this request' });
    }

    if (helpRequest.rating.score) {
      return res.status(400).json({ message: 'This request has already been rated' });
    }

    helpRequest.rating = {
      score,
      feedback,
      createdAt: new Date()
    };

    await helpRequest.save();

    // Update helper's average rating
    if (helpRequest.helper) {
      const helper = await require('../models/User').findById(helpRequest.helper);
      if (helper) {
        const allRatings = await HelpRequest.find({
          helper: helper._id,
          'rating.score': { $exists: true }
        });

        const totalRating = allRatings.reduce((sum, req) => sum + req.rating.score, 0);
        helper.rating.average = totalRating / allRatings.length;
        helper.rating.count = allRatings.length;
        await helper.save();
      }
    }

    res.json({
      message: 'Rating submitted successfully',
      helpRequest
    });
  } catch (error) {
    console.error('Rate help request error:', error);
    res.status(500).json({ message: 'Server error while rating help request' });
  }
});

// @route   PUT /api/help-requests/:id
// @desc    Update a help request
// @access  Private
router.put('/:id', auth, [
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('urgency').optional().isIn(['low', 'medium', 'high'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    if (helpRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own help requests' });
    }

    if (helpRequest.status !== 'open') {
      return res.status(400).json({ message: 'Can only update open requests' });
    }

    const { title, description, urgency } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (urgency) updateData.urgency = urgency;

    const updatedRequest = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('requester', 'name profile.avatar rating');

    res.json({
      message: 'Help request updated successfully',
      helpRequest: updatedRequest
    });
  } catch (error) {
    console.error('Update help request error:', error);
    res.status(500).json({ message: 'Server error while updating help request' });
  }
});

// @route   DELETE /api/help-requests/:id
// @desc    Cancel a help request
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const helpRequest = await HelpRequest.findById(req.params.id);

    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    if (helpRequest.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel your own help requests' });
    }

    if (helpRequest.status !== 'open') {
      return res.status(400).json({ message: 'Can only cancel open requests' });
    }

    helpRequest.status = 'cancelled';
    await helpRequest.save();

    res.json({ message: 'Help request cancelled successfully' });
  } catch (error) {
    console.error('Cancel help request error:', error);
    res.status(500).json({ message: 'Server error while cancelling help request' });
  }
});

module.exports = router; 