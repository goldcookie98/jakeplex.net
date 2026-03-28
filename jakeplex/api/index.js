import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import tmdbRoutes from './routes/tmdb.js';
import requestRoutes from './routes/requests.js';
import authRoutes from './routes/auth.js';
import plexRoutes from './routes/plex.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
