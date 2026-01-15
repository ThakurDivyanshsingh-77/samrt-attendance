
const cron = require('node-cron');
const AttendanceSession = require('../models/AttendanceSession.model');
const socketService = require('../services/socket.service');

// Run every minute
const startSessionExpiryJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find expired but still active sessions
      const expiredSessions = await AttendanceSession.find({
        isActive: true,
        isExpired: false,
        expiryTime: { $lte: now }
      });

      if (expiredSessions.length > 0) {
        console.log(`Expiring ${expiredSessions.length} sessions...`);

        // Update all expired sessions
        await AttendanceSession.updateMany(
          {
            isActive: true,
            isExpired: false,
            expiryTime: { $lte: now }
          },
          {
            $set: {
              isActive: false,
              isExpired: true
            }
          }
        );

        // Notify connected clients
        expiredSessions.forEach(session => {
          socketService.emitSessionExpired(session._id.toString());
        });

        console.log(`✓ Expired ${expiredSessions.length} sessions`);
      }
    } catch (error) {
      console.error('Error in session expiry job:', error);
    }
  });

  console.log('✓ Session expiry job started');
};

module.exports = startSessionExpiryJob;