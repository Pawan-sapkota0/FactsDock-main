import express from 'express';
// nodemailer removed: use Resend API instead for production
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

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
    console.log(`Message from IP: ${ip} at ${new Date().toISOString()}`);

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
        from: 'World Facts <no-reply@worldfacts.com>',
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Message from ${name}`,
        html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${String(message).replace(/\n/g,'<br/>')}</p>`,
      });
      console.log('Resend send result:', JSON.stringify(sendResult, null, 2));
      if (sendResult.error) {
        console.error('Resend API returned error:', sendResult.error);
        return res.status(500).json({ success: false, error: `Resend error: ${sendResult.error.message || 'Unknown error'}` });
      }
    } catch (sendErr) {
      console.error('Resend send error (caught exception):', JSON.stringify(sendErr, Object.getOwnPropertyNames(sendErr), 2));
      return res.status(500).json({ success: false, error: `Failed to send: ${sendErr.message || 'Unknown error'}` });
    }

    return res.status(200).json({ success: true, msg: 'Message stored and admin notified' });
  } catch (err) {
    console.error('Contact API Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
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
        adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
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
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
