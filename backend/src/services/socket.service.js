
module.exports = {
  init: (httpServer) => {
    io = require('socket.io')(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
        methods: ['GET', 'POST']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join session room
      socket.on('join-session', (sessionId) => {
        socket.join(`session-${sessionId}`);
        console.log(`Client ${socket.id} joined session ${sessionId}`);
      });

      // Leave session room
      socket.on('leave-session', (sessionId) => {
        socket.leave(`session-${sessionId}`);
        console.log(`Client ${socket.id} left session ${sessionId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  },

  emitAttendanceMarked: (sessionId, data) => {
    if (io) {
      io.to(`session-${sessionId}`).emit('attendance-marked', data);
    }
  },

  emitSessionExpired: (sessionId) => {
    if (io) {
      io.to(`session-${sessionId}`).emit('session-expired');
    }
  }
};