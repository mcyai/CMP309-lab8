import path from 'node:path';
import express from 'express';

const app = express();

// Port comes from the environment, with a fallback for local development.
const PORT = process.env.PORT || 3000;

// Number of requests received since the server started.
let requestsServed = 0;

// Middleware 1: print one line per request (timestamp, method, URL).
function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
}

// Middleware 2: count every request that reaches the server.
function requestCounter(req, res, next) {
  requestsServed += 1;
  next();
}

// Middleware must be registered before the routes so every request passes through them.
app.use(requestLogger);
app.use(requestCounter);

// Serve the public/ folder. The path is built from this file's location,
// so the server works no matter which folder it is started from.
// express.static also serves public/index.html for GET /.
app.use(express.static(path.join(import.meta.dirname, 'public')));

// Plain text response.
app.get('/hello', (req, res) => {
  res.type('text/plain').send("Hello from cagri's server");
});

// Plain text file body with an explicit text/plain content type.
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send('User-agent: *\nDisallow: /api/admin\n');
});

// Redirect to /hello (302 Found by default).
app.get('/old-page', (req, res) => {
  res.redirect('/hello');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
