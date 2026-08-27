import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import offersRouter from './routes/offers';
import userRouter from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Removed insecure express.static for uploads. Use an authenticated route if downloading is needed.

// Routes
app.use('/api/offers', offersRouter);
app.use('/api/user', userRouter);

// Health check & root route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
      <h2>Offerwise Backend API Server</h2>
      <p>This is the backend API server (port 3001).</p>
      <p>To view the full <strong>Offerwise Web Application UI</strong>, please open:</p>
      <a href="http://localhost:3000" style="font-size: 1.2rem; font-weight: bold; color: #6366f1;">http://localhost:3000</a>
    </div>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'offerwise-backend' });
});

// Centralized error handler (catches multer fileFilter/size errors and anything
// else passed to next()) so clients always get a JSON response, not Express's HTML page.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled request error:', err);
  const msg = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(400).json({ error: msg });
});

export default app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}
