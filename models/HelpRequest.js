const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'education', 'medical', 'elderly-care', 'emergency', 'transportation', 'household', 'other']
  },
  urgency: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  helper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  images: [{
    url: String,
    caption: String
  }],
  tags: [String],
  contactPreference: {
    type: String,
    enum: ['chat', 'phone', 'email'],
    default: 'chat'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  completedAt: Date,
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    createdAt: Date
  }
}, {
  timestamps: true
});

// Index for geospatial queries
helpRequestSchema.index({ location: '2dsphere' });

// Index for status and category queries
helpRequestSchema.index({ status: 1, category: 1 });
helpRequestSchema.index({ status: 1, urgency: 1 });

// Virtual for checking if request is expired
helpRequestSchema.virtual('isExpired').get(function() {
  return this.expiresAt < new Date();
});

// Method to check if request can be accepted
helpRequestSchema.methods.canBeAccepted = function() {
  return this.status === 'open' && !this.isExpired;
};

// Method to accept help request
helpRequestSchema.methods.acceptRequest = function(helperId) {
  if (!this.canBeAccepted()) {
    throw new Error('Request cannot be accepted');
  }
  this.helper = helperId;
  this.status = 'in-progress';
  return this.save();
};

// Method to complete help request
helpRequestSchema.methods.completeRequest = function() {
  if (this.status !== 'in-progress') {
    throw new Error('Request is not in progress');
  }
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Static method to find nearby requests
helpRequestSchema.statics.findNearby = function(coordinates, maxDistance = 10000) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    },
    status: 'open',
    expiresAt: { $gt: new Date() }
  }).populate('requester', 'name profile.avatar rating');
};

module.exports = mongoose.model('HelpRequest', helpRequestSchema); 