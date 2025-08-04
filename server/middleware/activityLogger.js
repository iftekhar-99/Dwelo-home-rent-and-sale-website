import Activity from '../models/Activity.js';

export const logOwnerActivity = async (req, res, next) => {
  const originalSend = res.json;
  res.json = function(data) {
    if (data.success && req.owner) {
      const activity = {
        ownerId: req.owner.ownerId,
        type: getActivityType(req),
        details: getActivityDetails(req, data),
        timestamp: new Date()
      };

      Activity.create(activity).catch(err => 
        console.error('Activity logging error:', err)
      );
    }
    originalSend.call(this, data);
  };
  next();
};

function getActivityType(req) {
  const path = req.path;
  const method = req.method;

  if (path.includes('/properties')) {
    if (method === 'POST') return 'property_created';
    if (method === 'PUT') return 'property_updated';
    if (method === 'DELETE') return 'property_deleted';
  }

  if (path.includes('/requests')) {
    if (path.includes('/approve')) return 'request_approved';
    if (path.includes('/reject')) return 'request_rejected';
  }

  return 'other';
}

function getActivityDetails(req, data) {
  const type = getActivityType(req);
  switch (type) {
    case 'property_created':
      return `Created new property: ${data.data?.property?.title}`;
    case 'property_updated':
      return `Updated property: ${data.data?.property?.title}`;
    case 'property_deleted':
      return 'Deleted a property';
    case 'request_approved':
    case 'request_rejected':
      return `${type.split('_')[1]} request for property: ${data.data?.request?.propertyId}`;
    default:
      return 'Performed an action';
  }
}