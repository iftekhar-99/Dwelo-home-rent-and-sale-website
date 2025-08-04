import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['property', 'user', 'review', 'message', 'other'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetType: {
    type: String,
    enum: ['Property', 'User', 'Review', 'Message'],
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'fraud', 'inappropriate', 'fake', 'harassment', 'copyright', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  evidence: [{
    type: String,
    enum: ['screenshot', 'link', 'document', 'other']
  }],
  evidenceUrls: [String],
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed', 'escalated'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  assignedAt: Date,
  adminNotes: [{
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  actions: [{
    action: {
      type: String,
      enum: [
        'warn_user', 'suspend_user', 'ban_user', 'delete_content', 
        'feature_property', 'unfeature_property', 'escalate_legal',
        'no_action', 'other'
      ]
    },
    details: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    performedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  resolvedAt: Date,
  resolution: {
    type: String,
    enum: ['action_taken', 'no_violation', 'insufficient_evidence', 'duplicate', 'other']
  },
  resolutionNotes: String,
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalatedTo: {
    department: {
      type: String,
      enum: ['legal', 'security', 'compliance', 'support']
    },
    escalatedAt: Date,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    escalationNotes: String
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  tags: [String],
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: String
  }
}, {
  timestamps: true
});

// Indexes for optimal query performance
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ targetId: 1 });
reportSchema.index({ targetType: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ priority: 1 });
reportSchema.index({ reason: 1 });
reportSchema.index({ assignedTo: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ isEscalated: 1 });
reportSchema.index({ followUpRequired: 1 });

// Virtual for total actions count
reportSchema.virtual('totalActions').get(function() {
  return this.actions.length;
});

// Virtual for is overdue (if follow-up required and past date)
reportSchema.virtual('isOverdue').get(function() {
  if (!this.followUpRequired || !this.followUpDate) return false;
  return new Date() > this.followUpDate;
});

// Method to add admin note
reportSchema.methods.addAdminNote = function(adminId, note) {
  this.adminNotes.push({
    adminId,
    note
  });
  return this.save();
};

// Method to assign to admin
reportSchema.methods.assignToAdmin = function(adminId) {
  this.assignedTo = adminId;
  this.assignedAt = new Date();
  return this.save();
};

// Method to add action
reportSchema.methods.addAction = function(actionData) {
  this.actions.push(actionData);
  return this.save();
};

// Method to resolve report
reportSchema.methods.resolve = function(adminId, resolution, notes = '') {
  this.status = 'resolved';
  this.resolvedBy = adminId;
  this.resolvedAt = new Date();
  this.resolution = resolution;
  this.resolutionNotes = notes;
  return this.save();
};

// Method to escalate report
reportSchema.methods.escalate = function(adminId, department, notes = '') {
  this.isEscalated = true;
  this.escalatedTo = {
    department,
    escalatedAt: new Date(),
    escalatedBy: adminId,
    escalationNotes: notes
  };
  this.status = 'escalated';
  return this.save();
};

// Method to set follow-up
reportSchema.methods.setFollowUp = function(date, required = true) {
  this.followUpRequired = required;
  this.followUpDate = date;
  return this.save();
};

// Static method to find pending reports
reportSchema.statics.findPending = function() {
  return this.find({ status: 'pending' })
    .populate('reportedBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find reports by priority
reportSchema.statics.findByPriority = function(priority) {
  return this.find({ priority, status: { $in: ['pending', 'investigating'] } })
    .populate('reportedBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to find overdue follow-ups
reportSchema.statics.findOverdueFollowUps = function() {
  return this.find({
    followUpRequired: true,
    followUpDate: { $lt: new Date() },
    status: { $in: ['pending', 'investigating'] }
  })
    .populate('reportedBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ followUpDate: 1 });
};

const Report = mongoose.model('Report', reportSchema);

export default Report; 