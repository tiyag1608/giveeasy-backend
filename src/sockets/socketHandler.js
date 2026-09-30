let ioInstance = null;

/**
 * Initialize Socket.io server
 * @param {object} io - Socket.io Server instance
 */
const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket.io Client Connected]: ${socket.id}`);

    // Join room for specific campaign to receive live updates
    socket.on('join_campaign', (campaignId) => {
      socket.join(`campaign_${campaignId}`);
      console.log(`📡 Socket ${socket.id} joined room: campaign_${campaignId}`);
    });

    // Leave room
    socket.on('leave_campaign', (campaignId) => {
      socket.leave(`campaign_${campaignId}`);
      console.log(`👋 Socket ${socket.id} left room: campaign_${campaignId}`);
    });

    // Join user-specific room for real-time personal notifications
    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`👤 Socket ${socket.id} joined personal room: user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io Client Disconnected]: ${socket.id}`);
    });
  });
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!ioInstance) {
    console.warn('Socket.io has not been initialized yet');
  }
  return ioInstance;
};

/**
 * Broadcast campaign progress update to all connected clients & campaign room
 */
const emitCampaignProgress = (campaignData, donationData) => {
  if (!ioInstance) return;

  const payload = {
    campaignId: campaignData._id,
    title: campaignData.title,
    raisedAmount: campaignData.raisedAmount,
    targetAmount: campaignData.targetAmount,
    percentageRaised: campaignData.percentageRaised,
    donorCount: campaignData.donorCount,
    latestDonation: donationData ? {
      donorName: donationData.donorName,
      amount: donationData.amount,
      createdAt: donationData.createdAt,
    } : null,
  };

  // Broadcast to specific campaign room
  ioInstance.to(`campaign_${campaignData._id}`).emit('campaign:progress_updated', payload);
  // Broadcast to global feed
  ioInstance.emit('campaign:progress_updated', payload);
  console.log(`📢 [Socket Broadcast] Emitted progress for Campaign "${campaignData.title}" (${payload.percentageRaised}%)`);
};

/**
 * Broadcast when cause is verified by admin
 */
const emitCauseStatus = (causeData) => {
  if (!ioInstance) return;
  ioInstance.emit('cause:status_updated', {
    causeId: causeData._id,
    title: causeData.title,
    status: causeData.status,
    ngoName: causeData.ngoName,
  });
};

/**
 * Broadcast live notification
 */
const emitLiveNotification = (userId, notification) => {
  if (!ioInstance) return;
  if (userId) {
    ioInstance.to(`user_${userId}`).emit('notification:new', notification);
  }
  // Also emit to all for demo showcase
  ioInstance.emit('notification:global', notification);
};

module.exports = {
  initSocket,
  getIO,
  emitCampaignProgress,
  emitCauseStatus,
  emitLiveNotification,
};
