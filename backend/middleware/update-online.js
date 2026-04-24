const { updateUserActivity } = require('../stores/online-users.store');

module.exports = function updateOnlineMiddleware(req, res, next) {
  if (req.userId) {
    updateUserActivity(req.userId);
  }
  next();
};