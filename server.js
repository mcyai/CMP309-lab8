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

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
