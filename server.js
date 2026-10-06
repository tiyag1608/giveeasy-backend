require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { initSocket } = require('./src/sockets/socketHandler');

const PORT = process.env.PORT || 5050;

const Campaign = require('./src/models/Campaign');
const seedData = require('./src/seed/seeder');

// Connect to MongoDB & auto-seed if empty
connectDB().then(async () => {
  try {
    const count = await Campaign.countDocuments();
    if (count === 0) {
      console.log('🌱 Database is empty — auto-seeding sample campaigns, causes, and users...');
      await seedData();
      console.log('✅ Auto-seed completed successfully!');
    }
  } catch (err) {
    console.warn('⚠️ Auto-seed check notice:', err.message);
  }
});

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Initialize Socket.io events
initSocket(io);

// Start server (explicitly binding 0.0.0.0 for Docker/cloud container routing)
server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 GiveEasy Donation Platform Backend Running`);
  console.log(`📡 Server Port:        http://localhost:${PORT}`);
  console.log(`📑 Swagger API Docs:   http://localhost:${PORT}/api-docs`);
  console.log(`🧪 Live Testbench UI:  http://localhost:${PORT}`);
  console.log(`🔌 WebSockets:         ws://localhost:${PORT} (Socket.io)`);
  console.log(`=======================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
});
