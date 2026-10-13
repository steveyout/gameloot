const rateLimit = require('express-rate-limit');

// Rate limiter for authentication attempts (prevents brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  }
});

// Rate limiter for game heartbeat pings (prevents DDoS / script bot spam)
const sessionPingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 pings per minute per IP (heartbeats are every ~30s normally)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Ping rate limit exceeded. Unnatural game heartbeat frequency detected.'
  }
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // max 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  sessionPingLimiter,
  apiLimiter
};
