// Vercel serverless function entry point
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple landing page redirect for Vercel
export default function handler(req, res) {
  // Serve the proper landing page for root requests
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const landingPath = path.join(__dirname, '../public/landing.html');
      const landingContent = fs.readFileSync(landingPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(landingContent);
      return;
    } catch (error) {
      // Fallback to inline HTML if file read fails
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unami Foundation Moments</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .logo { width: 100px; height: 100px; margin: 20px auto; }
        .btn { display: inline-block; padding: 12px 24px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🌍</div>
        <h1>Unami Foundation Moments</h1>
        <p>WhatsApp-native community engagement platform for South Africa</p>
        <p>Join our community broadcasts and stay connected with local opportunities, events, and resources.</p>
        
        <a href="https://wa.me/27658295041?text=START" class="btn">📱 Join WhatsApp Community</a>
        
        <div style="margin-top: 40px; padding: 20px; background: #f5f5f5; border-radius: 10px;">
            <h3>🚀 System Status</h3>
            <p>✅ Landing Page: Active</p>
            <p>🔧 Admin Dashboard: <a href="https://moments-api.unamifoundation.org/admin-dashboard.html">Railway Platform</a></p>
            <p>📱 WhatsApp API: Active (+27 65 829 5041)</p>
        </div>
        
        <footer style="margin-top: 40px; color: #666; font-size: 14px;">
            <p>© 2024 Unami Foundation. Empowering South African communities.</p>
        </footer>
    </div>
</body>
</html>
      `);
      return;
    }
  }

  // Redirect admin dashboard to Railway
  if (req.url === '/admin-dashboard.html') {
    res.writeHead(302, { 'Location': 'https://moments-api.unamifoundation.org/admin-dashboard.html' });
    res.end();
    return;
  }

  // Redirect admin requests to Railway
  if (req.url.startsWith('/admin')) {
    res.writeHead(302, { 'Location': 'https://moments-api.unamifoundation.org' + req.url });
    res.end();
    return;
  }

  // Redirect API requests to Railway
  if (req.url.startsWith('/webhook') || req.url.startsWith('/health')) {
    res.writeHead(302, { 'Location': 'https://moments-api.unamifoundation.org' + req.url });
    res.end();
    return;
  }

  // 404 for other requests
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not found',
    message: 'This is the Unami Foundation Moments landing page. Admin and API functions are hosted on Railway.',
    adminDashboard: 'https://moments-api.unamifoundation.org/admin-dashboard.html'
  }));
}