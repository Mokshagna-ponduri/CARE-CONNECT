const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const HelpRequest = require('../models/HelpRequest');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get user's chat conversations
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Chat.getUserChats(req.user._id);

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
});

// @route   GET /api/chat/:chatId
// @desc    Get chat messages
// @access  Private
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'name profile.avatar')
      .populate('helpRequest', 'title category status')
      .populate('messages.sender', 'name profile.avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark messages as read
    await chat.markAsRead(req.user._id);

    res.json({ chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error while fetching chat' });
  }
});

// @route   POST /api/chat/:chatId/messages
// @desc    Send a message in chat
// @access  Private
router.post('/:chatId/messages', auth, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, messageType = 'text', attachments = [] } = req.body;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add message to chat
    await chat.addMessage(req.user._id, content, messageType, attachments);

    // Populate the updated chat
    await chat.populate('participants', 'name profile.avatar');
    await chat.populate('helpRequest', 'title category status');
    await chat.populate('messages.sender', 'name profile.avatar');

    res.json({
      message: 'Message sent successfully',
      chat
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// @route   POST /api/chat/start
// @desc    Start a new chat for a help request
// @access  Private
router.post('/start', auth, [
  body('helpRequestId').isMongoId().withMessage('Valid help request ID is required'),
  body('otherUserId').isMongoId().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { helpRequestId, otherUserId } = req.body;

    // Verify help request exists
    const helpRequest = await HelpRequest.findById(helpRequestId);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    // Verify other user exists
    const otherUser = await require('../models/User').findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is authorized to start chat (requester or helper)
    const isRequester = helpRequest.requester.toString() === req.user._id.toString();
    const isHelper = helpRequest.helper && helpRequest.helper.toString() === req.user._id.toString();
    const isOtherUserRequester = helpRequest.requester.toString() === otherUserId;
    const isOtherUserHelper = helpRequest.helper && helpRequest.helper.toString() === otherUserId;

    if (!isRequester && !isHelper) {
      return res.status(403).json({ message: 'You are not authorized to start a chat for this request' });
    }

    if (!isOtherUserRequester && !isOtherUserHelper) {
      return res.status(403).json({ message: 'Other user is not involved in this help request' });
    }

    // Create or get existing chat
    const chat = await Chat.findOrCreateChat(
      [req.user._id, otherUserId],
      helpRequestId
    );

    res.json({
      message: 'Chat started successfully',
      chat
    });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ message: 'Server error while starting chat' });
  }
});

// @route   PUT /api/chat/:chatId/read
// @desc    Mark chat messages as read
// @access  Private
router.put('/:chatId/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await chat.markAsRead(req.user._id);

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error while marking messages as read' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    const conversations = await Chat.getUserChats(req.user._id);
    
    let totalUnread = 0;
    conversations.forEach(conversation => {
      const unreadCount = conversation.unreadCount.get(req.user._id.toString()) || 0;
      totalUnread += unreadCount;
    });

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

// @route   DELETE /api/chat/:chatId
// @desc    Delete a chat (soft delete)
// @access  Private
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete - mark as inactive
    chat.isActive = false;
    await chat.save();

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error while deleting chat' });
  }
});

// @route   GET /api/chat/help-request/:helpRequestId
// @desc    Get chat for a specific help request
// @access  Private
router.get('/help-request/:helpRequestId', auth, async (req, res) => {
  try {
    const helpRequestId = req.params.helpRequestId;

    // Verify help request exists and user is involved
    const helpRequest = await HelpRequest.findById(helpRequestId);
    if (!helpRequest) {
      return res.status(404).json({ message: 'Help request not found' });
    }

    const isRequester = helpRequest.requester.toString() === req.user._id.toString();
    const isHelper = helpRequest.helper && helpRequest.helper.toString() === req.user._id.toString();

    if (!isRequester && !isHelper) {
      return res.status(403).json({ message: 'You are not involved in this help request' });
    }

    // Find chat for this help request
    const chat = await Chat.findOne({
      helpRequest: helpRequestId,
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'name profile.avatar')
    .populate('helpRequest', 'title category status')
    .populate('messages.sender', 'name profile.avatar');

    if (!chat) {
      return res.json({ chat: null, message: 'No chat found for this help request' });
    }

    // Mark messages as read
    await chat.markAsRead(req.user._id);

    res.json({ chat });
  } catch (error) {
    console.error('Get help request chat error:', error);
    res.status(500).json({ message: 'Server error while fetching help request chat' });
  }
});

module.exports = router; 