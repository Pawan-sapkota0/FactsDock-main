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
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://bqijevhxrnekfsmvljrd.supabase.co"],
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

// NOTE: /api/send-email removed — use /api/contact instead

// POST /api/contact
// Saves contact message to the database and notifies admin via Resend.
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
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
      const sendResult = await resend.emails.send({
        from: 'FactsDock <no-reply@factsdock.com>',
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Message from ${escapeHtml(name)}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p>${escapeHtml(message).replace(/\n/g,'<br>')}</p>`,
      });
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
