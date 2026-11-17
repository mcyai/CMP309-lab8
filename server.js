import express from 'express';

const app = express();

// Port comes from the environment, with a fallback for local development.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
