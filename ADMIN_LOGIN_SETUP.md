# Hidden Admin Login Setup

## Overview

The admin login page has been secured and hidden from public access in production environments.

## Admin Login URL

**Production:** `https://yourdomain.com/secret-admin-login`
**Development:** `http://localhost:8080/secret-admin-login` or `http://localhost:8080/admin/login`

## Security Features Implemented

### 1. **Hidden Route**

- Admin login is only accessible at `/secret-admin-login`
- The standard `/admin/login` route redirects to home in production
- In development, both routes work for testing

### 2. **Server-Side Protection**

- Backend middleware (`blockAdminDiscovery`) blocks common admin discovery attempts:
  - `/admin`
  - `/admin/login`
  - `/admin/panel`
  - `/admin/dashboard`
  - `/administrator`
  - `/admin.php`
  - `/wp-admin`
  - `/api/admin`
- Returns 404 (Not Found) to hide the admin panel exists
- Logs all suspicious discovery attempts by IP

### 3. **Search Engine Protection**

- `robots.txt` disallows both `/admin` and `/secret-admin-login`
- Prevents indexing in search engines

### 4. **Rate Limiting**

- Max 5 failed login attempts per IP per 15 minutes
- Account locks for 15 minutes after exceeding limit
- Clears on successful login

### 5. **Token Verification**

- All admin operations require valid JWT token
- Tokens are verified server-side with Supabase
- Inactive admin accounts are blocked

## Usage Instructions

### For Admin Users

1. Navigate to `/secret-admin-login` (bookmark this URL)
2. Sign in with your email and password or Google OAuth
3. You will be redirected to the admin dashboard

### For Developers

- In development, use `/admin/login` for easier access
- Use `/secret-admin-login` to test production behavior
- Check server logs for blocked discovery attempts: `[Security] Blocked admin discovery attempt`

## Environment Configuration

Ensure these environment variables are set:

**Frontend (.env):**

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend (.env):**

```
NODE_ENV=production
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
RESEND_API_KEY=your-resend-key
ADMIN_EMAIL=admin@example.com
FRONTEND_URL=https://yourdomain.com
```

## Monitoring

Monitor these logs for security issues:

```bash
# Failed login attempts
console.warn(`[Security] Blocked admin discovery attempt from IP: ${ip}...`)

# Login rate limiting
console.warn(`Login account locked for IP ${ip}...`)

# Token verification failures
console.error('Token verification error (internal only):', err)
```

## Testing Checklist

- [ ] `/admin/login` redirects to home in production
- [ ] `/secret-admin-login` loads the login page
- [ ] Server returns 404 for `/admin` requests in production
- [ ] robots.txt blocks `/secret-admin-login`
- [ ] Login rate limiting works after 5 failed attempts
- [ ] Successful login clears rate limit
- [ ] Admin token verification works
- [ ] Inactive admin accounts are blocked
