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

// Hard-coded data: there is no database in this project.
const COURSES = [
  { id: 1, title: 'Web Programming', credits: 6 },
  { id: 2, title: 'Databases', credits: 5 },
  { id: 3, title: 'Algorithms and Data Structures', credits: 6 },
  { id: 4, title: 'Computer Networks', credits: 4 },
];

// JSON array of courses.
app.get('/api/courses', (req, res) => {
  res.json(COURSES);
});

// Real values from the running process.
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Echo two request headers back to the client.
app.get('/api/headers', (req, res) => {
  res.json({
    'user-agent': req.get('User-Agent'),
    accept: req.get('Accept'),
  });
});

// 201 Created: a new subscription resource conceptually came into existence.
app.post('/api/subscribe', (req, res) => {
  res.status(201).json({ subscribed: true });
});

// 403 Forbidden: the server understood the request but refuses it.
app.get('/api/admin', (req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});

// Number of requests counted by the requestCounter middleware.
app.get('/api/stats', (req, res) => {
  res.json({ requestsServed });
});

// 404 fallback. It must stay AFTER every route, otherwise it would hide them.
// app.use without a path matches any request that no route above handled
// (Express 5 does not accept the old app.get('*', ...) wildcard).
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not found' });
  } else {
    res.status(404).type('text/plain').send('404 - Page not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
