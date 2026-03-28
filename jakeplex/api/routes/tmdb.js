import { Router } from 'express';

const router = Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';

const tmdbFetch = async (endpoint, params = {}) => {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey || apiKey === 'YOUR_TMDB_API_KEY_HERE') {
        throw new Error('TMDB_API_KEY_MISSING');
    }
    const url = new URL(`${TMDB_BASE}${endpoint}`);
    url.searchParams.set('api_key', apiKey);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
    }
    return response.json();
};

// Multi-search (movies + TV shows)
router.get('/search', async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        if (!q) return res.status(400).json({ error: 'Query required' });

        const data = await tmdbFetch('/search/multi', { query: q, page });
        // Filter to only movies and TV shows
        data.results = data.results.filter(
            (item) => item.media_type === 'movie' || item.media_type === 'tv'
        );
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Movie details
router.get('/movie/:id', async (req, res) => {
    try {
        const data = await tmdbFetch(`/movie/${req.params.id}`, {
            append_to_response: 'credits,videos',
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TV show details
router.get('/tv/:id', async (req, res) => {
    try {
        const data = await tmdbFetch(`/tv/${req.params.id}`, {
            append_to_response: 'credits,videos',
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
