const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./models');
const { initSocket } = require('./services/socket');
const { apiLimiter } = require('./middleware/security');

const app = express();
const server = http.createServer(app);

// Trust first proxy (Nginx / Cloudflare / Reverse Proxy) for accurate IP resolution & rate limiting
app.set('trust proxy', 1);

// Socket.io for Real-time Instant Notifications
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
initSocket(io);

const PORT = parseInt(process.env.PORT || '5000', 10);

// Security Headers & Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Allows iframe embeds for HTML5 game testing
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// General Rate Limiter on API
app.use('/api', apiLimiter);

// API Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const legalRoutes = require('./routes/legal');

// Public Privacy Policy & Terms of Service (Root URLs & API endpoints - 100% Public, No Login Required)
// e.g. https://gameloot.youplex.cc/privacy, /terms, /tos, /api/privacy, /api/terms
app.use('/', legalRoutes);
app.use('/api', legalRoutes);
app.use('/api/legal', legalRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

// Static Uploads Storage (Game thumbnails, banners, assets)
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const gamesUploadDir = path.join(uploadsDir, 'games');
if (!fs.existsSync(gamesUploadDir)) fs.mkdirSync(gamesUploadDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'GameLoot Fullstack API & WebSocket Engine',
    port: PORT,
    db: 'MySQL Connected (Sequelize ORM)'
  });
});

// Single-Port: Mount Vite Admin Panel (Dev middleware or Static Dist)
async function setupFrontend() {
  const adminDist = path.resolve(__dirname, '../admin/dist');
  const adminRoot = path.resolve(__dirname, '../admin');

  const isLegalPath = (p) => {
    return p.startsWith('/privacy') || p.startsWith('/terms') || p.startsWith('/tos') || p.startsWith('/api');
  };

  if (process.env.NODE_ENV === 'production' && fs.existsSync(adminDist)) {
    console.log('📦 Serving production Admin build from admin/dist');
    app.use(express.static(adminDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || isLegalPath(req.path)) {
        return next();
      }
      res.sendFile(path.join(adminDist, 'index.html'));
    });
  } else {
    try {
      console.log('⚡ Mounting Vite Development Middleware in Express on port ' + PORT);
      const { createServer: createViteServer } = require('vite');
      const vite = await createViteServer({
        root: adminRoot,
        configFile: path.join(adminRoot, 'vite.config.js'),
        server: {
          middlewareMode: true
        },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('⚠️ Vite middleware initialization notice:', viteErr.message);
      if (fs.existsSync(adminDist)) {
        app.use(express.static(adminDist));
        app.use((req, res, next) => {
          if (req.method !== 'GET' || isLegalPath(req.path)) {
            return next();
          }
          res.sendFile(path.join(adminDist, 'index.html'));
        });
      }
    }
  }
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server exception:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Boot Fullstack Server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize ORM connected to MySQL (gameloot).');

    // Safe Non-Destructive Sync: create tables if they do not exist; NEVER drop or alter tables destructively
    await sequelize.sync({ force: false, alter: false });

    // Non-destructive schema guard: checks and adds new columns if missing without touching existing data
    const { ensureSafeSchema } = require('./database/safeSchema');
    await ensureSafeSchema(sequelize);

    // Setup Single-Port Vite Frontend
    await setupFrontend();

    server.listen(PORT, '0.0.0.0', () => {
      console.log('\n=============================================================');
      console.log(`🚀 GAMELOOT FULLSTACK ENGINE ONLINE ON SINGLE PORT ${PORT}`);
      console.log(`🌐 Admin Panel:     http://localhost:${PORT}`);
      console.log(`📜 Privacy Policy:  http://localhost:${PORT}/privacy`);
      console.log(`📜 Terms:           http://localhost:${PORT}/terms`);
      console.log(`⚡ API Health:       http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSockets:       ws://localhost:${PORT} (Instant Notifications)`);
      console.log('=============================================================\n');
    });
  } catch (err) {
    console.error('❌ Failed to launch GameLoot server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server };
