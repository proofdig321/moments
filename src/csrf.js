import cookieParser from 'cookie-parser';

export function csrfMiddleware(req, res, next) {
  // Only enforce for state-changing methods
  const unsafe = ['POST','PUT','DELETE','PATCH'];
  if (!unsafe.includes(req.method)) return next();

  const header = (req.get('x-csrf-token') || req.get('x-xsrf-token') || '').toString();
  const cookie = (req.cookies && req.cookies['xsrftoken']) || '';
  const envToken = process.env.ADMIN_CSRF_TOKEN || '';

  // Accept if header matches env token or matches cookie (double submit)
  if (header && (header === envToken || header === cookie)) return next();

  return res.status(403).json({ error: 'Missing or invalid CSRF token' });
}

export function csrfCookieSetter(req, res, next) {
  // set cookie for admin UI if token configured
  const token = process.env.ADMIN_CSRF_TOKEN;
  if (token) {
    res.cookie('xsrftoken', token, { httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  }
  next();
}

export default { csrfMiddleware, csrfCookieSetter };
