import express from 'express';
// nodemailer removed: use Resend API instead for production
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';
import escapeHtml from 'escape-html';
import helmet from 'helmet';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Security headers with Helmet.js
app.use(helmet());

// Middleware: Block and log admin path discovery attempts (security through obscurity)
const blockAdminDiscovery = (req, res, next) => {
  const path = req.path.toLowerCase();
  
  // Block common admin discovery paths in production
  if (process.env.NODE_ENV === 'production') {
    const blockedPaths = [
      '/admin',
      '/admin/login',
      '/admin/panel',
      '/admin/dashboard',
      '/administrator',
      '/admin.php',
      '/wp-admin',
      '/api/admin',
    ];
    
    if (blockedPaths.includes(path)) {
      // Log suspicious activity
      const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
      console.warn(`[Security] Blocked admin discovery attempt from IP: ${ip} at ${new Date().toISOString()}`);
      
      // Return 404 to hide that admin panel exists
      return res.status(404).json({ error: 'Not found' });
    }
  }
  
  next();
};

app.use(blockAdminDiscovery);

// Dynamic CSP directive with environment-based Supabase URL
const supabaseUrl = process.env.SUPABASE_URL || 'https://bqijevhxrnekfsmvljrd.supabase.co';
const supabaseHostname = new URL(supabaseUrl).hostname;

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", `https://${supabaseHostname}`],
    },
  })
);

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Resend client (API key required)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Supabase admin client for server-side writes (requires service key)
const supabaseAdmin =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;
// Basic in-memory rate limiter: Max 5 emails per IP per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5;
const rateMap = new Map();

// Login-specific rate limiter: Max 5 failed attempts per IP per 15 minutes
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_RATE_LIMIT_MAX = 5;
const loginAttemptMap = new Map(); // Maps IP -> { count, lastAttempt, lockedUntil }

// Cleanup old rate limit entries every hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap.entries()) {
    if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
      rateMap.delete(ip);
    }
  }
  // Also cleanup login attempts
  for (const [ip, entry] of loginAttemptMap.entries()) {
    if (now - entry.lastAttempt > LOGIN_RATE_LIMIT_WINDOW_MS) {
      loginAttemptMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// Middleware: Verify admin authentication token
const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Missing authorization token' });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured; cannot verify token');
      return res.status(503).json({ success: false, error: 'Service unavailable' });
    }

    const { data, error } = await supabaseAdmin.auth.admin.verifyJWT(token);
    if (error || !data) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Verify user is an admin
    const { data: admins, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('id, email, role, is_active')
      .eq('id', data.sub)
      .single();

    if (adminError || !admins) {
      return res.status(403).json({ success: false, error: 'User is not an admin' });
    }

    if (!admins.is_active) {
      return res.status(403).json({ success: false, error: 'Admin account is inactive' });
    }

    // Attach admin info to request
    req.admin = {
      id: admins.id,
      email: admins.email,
      role: admins.role,
    };

    next();
  } catch (err) {
    console.error('Token verification error (internal only):', err);
    res.status(500).json({ success: false, error: 'Token verification failed' });
  }
};

// Middleware: Check login attempt rate limit
const checkLoginRateLimit = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttemptMap.get(ip) || { count: 0, lastAttempt: now, lockedUntil: null };

  // Check if account is locked
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const remainingMs = entry.lockedUntil - now;
    const remainingMin = Math.ceil(remainingMs / 60000);
    return res.status(429).json({
      success: false,
      error: `Too many login attempts. Please try again in ${remainingMin} minute(s).`,
    });
  }

  // Reset if window expired
  if (now - entry.lastAttempt > LOGIN_RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.lockedUntil = null;
  }

  // Attach entry to request for use in response handler
  req.loginAttempt = entry;
  req.clientIp = ip;
  next();
};

// Helper: Record failed login attempt
const recordFailedLoginAttempt = (ip) => {
  const entry = loginAttemptMap.get(ip) || { count: 0, lastAttempt: Date.now(), lockedUntil: null };
  entry.count += 1;
  entry.lastAttempt = Date.now();

  // Lock after max attempts
  if (entry.count >= LOGIN_RATE_LIMIT_MAX) {
    entry.lockedUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
    console.warn(`Login account locked for IP ${ip} after ${entry.count} attempts`);
  }

  loginAttemptMap.set(ip, entry);
};

// Helper: Clear login attempts on successful login
const clearLoginAttempts = (ip) => {
  loginAttemptMap.delete(ip);
};

// Input validation helpers
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateMessageLength = (message) => message && message.trim().length > 0 && message.length <= 5000;

// NOTE: /api/send-email removed — use /api/contact instead

// POST /api/admin/verify-token
// Protected endpoint: verify admin token validity
app.post('/api/admin/verify-token', verifyAdminToken, (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin.id,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

// POST /api/auth/login-attempt
// Track login attempts and enforce rate limiting
app.post('/api/auth/login-attempt', checkLoginRateLimit, (req, res) => {
  const { email, success } = req.body || {};

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  if (success) {
    // Clear attempts on successful login
    clearLoginAttempts(req.clientIp);
    return res.status(200).json({ success: true, msg: 'Login successful' });
  } else {
    // Record failed attempt
    recordFailedLoginAttempt(req.clientIp);
    const entry = loginAttemptMap.get(req.clientIp);
    return res.status(401).json({
      success: false,
      error: 'Login failed',
      attempt: entry.count,
      maxAttempts: LOGIN_RATE_LIMIT_MAX,
      remaining: Math.max(0, LOGIN_RATE_LIMIT_MAX - entry.count),
    });
  }
});


// Saves contact message to the database and notifies admin via Resend.
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Validate input formats
    if (name.length > 100) {
      return res.status(400).json({ success: false, error: 'Name must be 100 characters or less' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }
    if (!validateMessageLength(message)) {
      return res.status(400).json({ success: false, error: 'Message must be between 1 and 5000 characters' });
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
    if (process.env.NODE_ENV !== 'production') {
      console.info(`Message from IP: ${ip} at ${new Date().toISOString()}`);
    }

    // rate-limit
    const now = Date.now();
    const entry = rateMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > RATE_LIMIT_WINDOW_MS) {
      entry.count = 0;
      entry.start = now;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
      return res.status(429).json({ success: false, error: 'Rate limit exceeded. Try again later.' });
    }
    entry.count += 1;
    rateMap.set(ip, entry);

    // Persist to DB
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not configured; skipping DB persist');
    } else {
      try {
        const insertResp = await supabaseAdmin.from('contact_messages').insert({ name, email, message });
        if (insertResp.error) {
          console.error('Failed to insert contact message', insertResp.error);
          // continue — still return success to frontend since message saved may be optional
        }
      } catch (dbErr) {
        console.error('Contact DB insert error', dbErr);
      }
    }

    // Notify admin via Resend (required)
    if (!resend) {
      console.error('RESEND_API_KEY is not configured; cannot send admin notification');
      return res.status(500).json({ success: false, error: 'Email service not configured' });
    }
    if (!process.env.ADMIN_EMAIL) {
      console.error('ADMIN_EMAIL is not configured; cannot send admin notification');
      return res.status(500).json({ success: false, error: 'Admin email not configured' });
    }

    try {
      // Add timeout for Resend API call (10 seconds)
      const sendPromise = resend.emails.send({
        from: 'FactsDock <no-reply@factsdock.com>',
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Message from ${escapeHtml(name)}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g,'<br>')}</p>`,
      });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      const sendResult = await Promise.race([sendPromise, timeoutPromise]);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Resend send result:', JSON.stringify(sendResult, null, 2));
      }
      if (sendResult.error) {
        console.error('Resend API error (internal only):', sendResult.error);
        return res.status(500).json({ success: false, error: 'Email service temporarily unavailable. Please try again later.' });
      }
    } catch (sendErr) {
      console.error('Resend send error (internal only):', sendErr);
      return res.status(500).json({ success: false, error: 'Email service temporarily unavailable. Please try again later.' });
    }

    return res.status(200).json({ success: true, msg: 'Message stored and admin notified' });
  } catch (err) {
    console.error('Contact API Error (internal only):', err);
    return res.status(500).json({ success: false, error: 'An error occurred. Please try again later.' });
  }
});

// GET /api/auth/callback/google
// OAuth callback handler for Google authentication
// Note: Supabase handles the OAuth code exchange internally.
// This endpoint is just a redirect target for Supabase to handle.
app.get('/api/auth/callback/google', async (req, res) => {
  try {
    const { error } = req.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    // Handle OAuth errors from Supabase - never expose details in URL
    if (error) {
      // Log full details internally only
      console.error('OAuth error from Supabase (internal only):', error);
      // Redirect without error details - frontend will show generic message
      return res.redirect(`${frontendUrl}/admin/login`);
    }

    // Supabase has already handled the code exchange and set the session.
    // The JWT token is automatically stored by the Supabase client in localStorage.
    // Redirect to admin dashboard
    if (process.env.NODE_ENV !== 'production') {
      console.log('OAuth callback processed, redirecting to admin');
    }
    res.redirect(`${frontendUrl}/admin`);
  } catch (err) {
    // Log full error internally only
    console.error('OAuth callback error (internal only):', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    // Redirect without exposing error
    res.redirect(`${frontendUrl}/admin/login`);
  }
});

app.get('/api/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      resend: {
        configured: !!resend,
        apiKeySet: !!process.env.RESEND_API_KEY,
        adminEmailSet: !!process.env.ADMIN_EMAIL,
      },
      supabase: {
        configured: !!supabaseAdmin,
        urlSet: !!process.env.SUPABASE_URL,
        serviceKeySet: !!process.env.SUPABASE_SERVICE_KEY,
      },
    },
  };

  // Report overall status
  const allReady = health.services.resend.configured && health.services.supabase.configured;
  if (!allReady) {
    health.status = 'degraded';
    if (!health.services.resend.configured) health.resend_warning = 'RESEND_API_KEY or ADMIN_EMAIL not set';
    if (!health.services.supabase.configured) health.supabase_warning = 'SUPABASE_URL or SUPABASE_SERVICE_KEY not set';
  }

  return res.status(allReady ? 200 : 503).json(health);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.info(`Backend running on port ${PORT}`));
