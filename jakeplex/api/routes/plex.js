import { Router } from 'express';
import { getRequests } from '../db.js';

const router = Router();

router.get('/check', async (req, res) => {
    try {
        const { title, year } = req.query;
        if (!title) {
            return res.status(400).json({ error: 'Title required' });
        }

        const plexUrl = process.env.PLEX_URL;
        const plexToken = process.env.PLEX_TOKEN;

        // If Plex isn't configured, just return false (not on Plex)
        if (!plexUrl || !plexToken || plexUrl.includes('your-plex-ip') || plexToken.includes('YOUR_PLEX_TOKEN')) {
            return res.json({ available: false, configured: false });
        }

        // Clean up the URL format just in case
        const cleanPlexUrl = plexUrl.endsWith('/') ? plexUrl.slice(0, -1) : plexUrl;

        // Call Plex Search API securely from the backend
        const searchUrl = `${cleanPlexUrl}/search?query=${encodeURIComponent(title)}&X-Plex-Token=${plexToken}`;

        const response = await fetch(searchUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Plex API Error: ${response.status}`);
            return res.json({ available: false, error: 'Plex connection failed' });
        }

        const data = await response.json();

        // Plex returns results in MediaContainer.Metadata array
        const results = data.MediaContainer?.Metadata || [];

        // Check if we have a match
        // We'll do a simple match on title, and optionally year to be safe
        let isAvailable = false;

        if (results.length > 0) {
            for (const item of results) {
                // Plex media types: 1=movie, 2=show
                if (item.type === 'movie' || item.type === 'show') {
                    // Check if title matches (case insensitive)
                    const titleMatches = item.title.toLowerCase() === title.toLowerCase();

                    // Check if year matches (if provided)
                    let yearMatches = true;
                    if (year && item.year) {
                        // Allow 1 year difference due to release date variations
                        yearMatches = Math.abs(parseInt(item.year) - parseInt(year)) <= 1;
                    }

                    if (titleMatches && yearMatches) {
                        isAvailable = true;
                        break;
                    }
                }
            }
        }

        // Return ONLY a simple boolean to the frontend to keep Plex details secure
        res.json({ available: isAvailable, configured: true });
    } catch (err) {
        console.error('Plex Proxy Error:', err);
        // Fail silently to the frontend so the app doesn't break if Plex is offline
        res.json({ available: false, error: 'Internal server error' });
    }
});

// Securely fetch all installed movies/shows
router.get('/library', async (req, res) => {
    try {
        const plexUrl = process.env.PLEX_URL;
        const plexToken = process.env.PLEX_TOKEN;

        if (!plexUrl || !plexToken || plexUrl.includes('your-plex-ip') || plexToken.includes('YOUR_PLEX_TOKEN')) {
            return res.json({ error: 'Plex not configured', items: [] });
        }

        const cleanPlexUrl = plexUrl.endsWith('/') ? plexUrl.slice(0, -1) : plexUrl;

        // 1. Get library sections
        const sectionsRes = await fetch(`${cleanPlexUrl}/library/sections?X-Plex-Token=${plexToken}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!sectionsRes.ok) throw new Error('Failed to fetch sections');
        const sectionsData = await sectionsRes.json();
        const directories = sectionsData.MediaContainer?.Directory || [];

        // 2. Fetch contents for movie/show sections in parallel to avoid Vercel timeouts
        const fetchPromises = [];

        for (const dir of directories) {
            if (dir.type === 'movie' || dir.type === 'show') {
                const promise = fetch(`${cleanPlexUrl}/library/sections/${dir.key}/all?X-Plex-Token=${plexToken}`, {
                    headers: { 'Accept': 'application/json' }
                }).then(async (libRes) => {
                    if (libRes.ok) {
                        const libData = await libRes.json();
                        const metadata = libData.MediaContainer?.Metadata || [];

                        // Sanitize the metadata before sending to frontend
                        return metadata.map(item => ({
                            id: item.ratingKey,
                            title: item.title,
                            year: item.year,
                            type: dir.type, // 'movie' or 'show'
                            poster_path: item.thumb,
                            addedAt: item.addedAt
                        }));
                    }
                    return [];
                }).catch(e => {
                    console.error('Section fetch error:', e);
                    return [];
                });

                fetchPromises.push(promise);
            }
        }

        const resultsArrays = await Promise.all(fetchPromises);
        let allItems = resultsArrays.flat();

        // Sort by most recently added
        allItems.sort((a, b) => b.addedAt - a.addedAt);

        res.json({ items: allItems });
    } catch (err) {
        console.error('Plex Library Error:', err.message, err.cause);
        res.json({ items: [], error: `Fetch failed: ${err.message} | Cause: ${err.cause ? err.cause.message : 'unknown'}` });
    }
});

// Securely fetch 4 most recently added items that are not requested
router.get('/recent-unrequested', async (req, res) => {
    try {
        const plexUrl = process.env.PLEX_URL;
        const plexToken = process.env.PLEX_TOKEN;

        if (!plexUrl || !plexToken || plexUrl.includes('your-plex-ip') || plexToken.includes('YOUR_PLEX_TOKEN')) {
            return res.json({ error: 'Plex not configured', items: [] });
        }

        const cleanPlexUrl = plexUrl.endsWith('/') ? plexUrl.slice(0, -1) : plexUrl;

        // Fetch requests from DB
        const requests = await getRequests();
        const requestedTitles = new Set(requests.map(r => r.title?.toLowerCase().trim()));

        // 1. Get library sections
        const sectionsRes = await fetch(`${cleanPlexUrl}/library/sections?X-Plex-Token=${plexToken}`, {
            headers: { 'Accept': 'application/json' }
        });

        if (!sectionsRes.ok) throw new Error('Failed to fetch sections');
        const sectionsData = await sectionsRes.json();
        const directories = sectionsData.MediaContainer?.Directory || [];

        // 2. Fetch contents for movie/show sections in parallel
        const fetchPromises = [];

        for (const dir of directories) {
            if (dir.type === 'movie' || dir.type === 'show') {
                const promise = fetch(`${cleanPlexUrl}/library/sections/${dir.key}/all?X-Plex-Token=${plexToken}`, {
                    headers: { 'Accept': 'application/json' }
                }).then(async (libRes) => {
                    if (libRes.ok) {
                        const libData = await libRes.json();
                        const metadata = libData.MediaContainer?.Metadata || [];

                        return metadata.map(item => ({
                            id: item.ratingKey,
                            title: item.title,
                            year: item.year,
                            type: dir.type,
                            poster_path: item.thumb,
                            addedAt: item.addedAt
                        }));
                    }
                    return [];
                }).catch(e => {
                    console.error('Section fetch error:', e);
                    return [];
                });

                fetchPromises.push(promise);
            }
        }

        const resultsArrays = await Promise.all(fetchPromises);
        let allItems = resultsArrays.flat();

        // Sort by most recently added
        allItems.sort((a, b) => b.addedAt - a.addedAt);

        // Filter out requested items
        const unrequestedItems = allItems.filter(item => !requestedTitles.has(item.title?.toLowerCase().trim()));

        res.json({ items: unrequestedItems.slice(0, 4) });
    } catch (err) {
        console.error('Plex Recent-Unrequested Error:', err.message, err.cause);
        res.json({ items: [], error: `Fetch failed: ${err.message}` });
    }
});

// Securely proxy Plex images so tokens aren't sent to frontend
router.get('/image', async (req, res) => {
    try {
        const { path } = req.query;
        if (!path) return res.status(400).send('Path required');

        const plexUrl = process.env.PLEX_URL;
        const plexToken = process.env.PLEX_TOKEN;
        const cleanPlexUrl = plexUrl.endsWith('/') ? plexUrl.slice(0, -1) : plexUrl;

        const imageUrl = `${cleanPlexUrl}${path}?X-Plex-Token=${plexToken}`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return res.status(response.status).send('Image failed to load');
        }

        const buffer = await response.arrayBuffer();
        res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // cache for 1 day
        res.send(Buffer.from(buffer));
    } catch (err) {
        console.error('Image proxy error:', err);
        res.status(500).send('Error loading image');
    }
});

export default router;
