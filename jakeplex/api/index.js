import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import tmdbRoutes from './routes/tmdb.js';
import requestRoutes from './routes/requests.js';
import authRoutes from './routes/auth.js';
import plexRoutes from './routes/plex.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Set security HTTP headers
app.use(helmet());

// 2. Limit requests from same API
const limiter = rateLimit({
    max: 150, // Limit each IP to 150 requests per windowMs
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

app.use(cors());
app.use(express.json({ limit: '10kb' })); // 3. Body parser, limited to 10kb against DOS

// 4. Data sanitization against HTTP Parameter Pollution attacks
app.use(hpp());

// Routes
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/plex', plexRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🎬 JakePlex API server running on http://localhost:${PORT}`);
    });
}
