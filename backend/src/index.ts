import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import routes from '@/routes';

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Game Backend is running!');
});

// API Routes
app.use('/', routes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
