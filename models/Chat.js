const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  attachments: [{
    url: String,
    filename: String,
    fileType: String
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  helpRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HelpRequest',
    required: true
  },
  messages: [messageSchema],
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ helpRequest: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

// Method to add a message to the chat
chatSchema.methods.addMessage = function(senderId, content, messageType = 'text', attachments = []) {
  const message = {
    sender: senderId,
    content,
    messageType,
    attachments
  };
  
  this.messages.push(message);
  this.lastMessage = {
    content,
    sender: senderId,
    timestamp: new Date()
  };
  
  // Update unread count for other participants
  this.participants.forEach(participantId => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });
  
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId) {
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
    }
  });
  
  this.unreadCount.set(userId.toString(), 0);
  return this.save();
};

// Static method to find or create chat between users for a help request
chatSchema.statics.findOrCreateChat = async function(participantIds, helpRequestId) {
  let chat = await this.findOne({
    participants: { $all: participantIds },
    helpRequest: helpRequestId
  }).populate('participants', 'name profile.avatar');
  
  if (!chat) {
    chat = new this({
      participants: participantIds,
      helpRequest: helpRequestId,
      messages: [],
      unreadCount: new Map()
    });
    await chat.save();
  }
  
  // Always populate after save or find
  chat = await chat.populate('participants', 'name profile.avatar');
  chat = await chat.populate('helpRequest', 'title category status');
  
  return chat;
};

// Static method to get user's chats
chatSchema.statics.getUserChats = function(userId) {
  return this.find({
    participants: { $in: [userId] },
    isActive: true
  })
  .populate('participants', 'name profile.avatar')
  .populate('helpRequest', 'title category status')
  .populate('lastMessage.sender', 'name profile.avatar')
  .populate('messages.sender', 'name profile.avatar')
  .sort({ 'lastMessage.timestamp': -1, createdAt: -1 });
};

module.exports = mongoose.model('Chat', chatSchema); 