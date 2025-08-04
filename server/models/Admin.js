import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  adminLevel: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'user_management',
      'property_management',
      'verification_management',
      'payment_management',
      'report_management',
      'system_settings',
      'analytics_view',
      'content_moderation'
    ]
  }],
  assignedRegions: [{
    city: String,
    state: String,
    country: String
  }],
  activityLog: [{
    action: {
      type: String,
      required: true
    },
    target: {
      type: String,
      enum: ['user', 'property', 'verification', 'payment', 'system']
    },
    targetId: mongoose.Schema.Types.ObjectId,
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  }],
  verificationActions: [{
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Owner'
    },
    action: {
      type: String,
      enum: ['approved', 'rejected', 'requested_changes']
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  supportTickets: [{
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupportTicket'
    },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'resolved', 'closed']
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    success: {
      type: Boolean,
      default: true
    }
  }]
}, { 
  timestamps: true 
});

// Indexes for optimal query performance
adminSchema.index({ userId: 1 });
adminSchema.index({ adminLevel: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ 'assignedRegions.city': 1 });
adminSchema.index({ 'assignedRegions.state': 1 });
adminSchema.index({ lastActivity: -1 });

// Virtual for total actions count
adminSchema.virtual('totalActions').get(function() {
  return this.activityLog.length;
});

// Virtual for active support tickets count
adminSchema.virtual('activeSupportTicketsCount').get(function() {
  return this.supportTickets.filter(ticket => 
    ['assigned', 'in_progress'].includes(ticket.status)
  ).length;
});

// Method to add activity log
adminSchema.methods.addActivityLog = function(activityData) {
  this.activityLog.push(activityData);
  this.lastActivity = new Date();
  return this.save();
};

// Method to add verification action
adminSchema.methods.addVerificationAction = function(actionData) {
  this.verificationActions.push(actionData);
  return this.save();
};

// Method to assign support ticket
adminSchema.methods.assignSupportTicket = function(ticketId) {
  this.supportTickets.push({
    ticketId,
    status: 'assigned'
  });
  return this.save();
};

// Method to update support ticket status
adminSchema.methods.updateSupportTicketStatus = function(ticketId, status) {
  const ticket = this.supportTickets.find(t => t.ticketId.equals(ticketId));
  if (ticket) {
    ticket.status = status;
    if (status === 'resolved' || status === 'closed') {
      ticket.resolvedAt = new Date();
    }
  }
  return this.save();
};

// Method to add login history
adminSchema.methods.addLoginHistory = function(loginData) {
  this.loginHistory.push(loginData);
  this.lastActivity = new Date();
  return this.save();
};

// Method to check permission
adminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.adminLevel === 'super_admin';
};

// Method to check if admin can manage region
adminSchema.methods.canManageRegion = function(city, state) {
  if (this.adminLevel === 'super_admin') return true;
  
  return this.assignedRegions.some(region => 
    region.city === city && region.state === state
  );
};

// Pre-save hook to set default permissions based on admin level
adminSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('adminLevel')) {
    switch (this.adminLevel) {
      case 'super_admin':
        this.permissions = [
          'user_management',
          'property_management',
          'verification_management',
          'payment_management',
          'report_management',
          'system_settings',
          'analytics_view',
          'content_moderation'
        ];
        break;
      case 'admin':
        this.permissions = [
          'user_management',
          'property_management',
          'verification_management',
          'payment_management',
          'report_management',
          'analytics_view',
          'content_moderation'
        ];
        break;
      case 'moderator':
        this.permissions = [
          'property_management',
          'verification_management',
          'content_moderation'
        ];
        break;
    }
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin; 