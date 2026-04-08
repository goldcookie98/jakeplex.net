import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecentlyAdded() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const response = await fetch('/api/plex/recent-unrequested');
                const data = await response.json();
                if (data.items) {
                    setItems(data.items);
                }
            } catch (err) {
                console.error("Failed to fetch recently added:", err);
            } finally {
                setLoading(false);
                // Small delay so the fade-in is perceptible
                setTimeout(() => setVisible(true), 50);
            }
        };

        fetchRecent();
    }, []);

    const handleCardClick = async (item) => {
        try {
            const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(item.title)}`);
            const data = await res.json();
            
            const tmdbType = item.type === 'show' ? 'tv' : 'movie';
            const results = data.results || [];
            
            let bestMatch = results.find(r => {
                if (r.media_type !== tmdbType) return false;
                const rTitle = (r.title || r.name || '').toLowerCase();
                const iTitle = (item.title || '').toLowerCase();
                return rTitle.includes(iTitle) || iTitle.includes(rTitle);
            });
            
            if (!bestMatch) {
                bestMatch = results.find(r => r.media_type === tmdbType);
            }
            
            if (bestMatch) {
                navigate(`/${bestMatch.media_type}/${bestMatch.id}`);
            } else {
                navigate(`/search?q=${encodeURIComponent(item.title)}`);
            }
        } catch (err) {
            navigate(`/search?q=${encodeURIComponent(item.title)}`);
        }
    };

    // Always render the container at full size to prevent layout jump.
    // Show skeletons while loading, fade in real content when ready.
    return (
        <div
            className="recently-added-container"
            style={{
                opacity: loading ? 0 : visible ? 1 : 0,
                transition: 'opacity 0.5s ease',
                // Hide completely (no space) only if loaded and empty
                display: (!loading && items.length === 0) ? 'none' : undefined,
            }}
        >
            <h2 className="recently-added-title">Newly added to Plex</h2>
            <div className="recently-added-grid">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="recently-added-card recently-added-skeleton" />
                    ))
                    : items.map((item, index) => (
                        <div
                            key={item.id || index}
                            className="recently-added-card"
                            style={{ animationDelay: `${index * 80}ms`, cursor: 'pointer' }}
                            onClick={() => handleCardClick(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleCardClick(item)}
                        >
                            {item.poster_path ? (
                                <img
                                    className="recently-added-poster"
                                    src={`/api/plex/image?path=${encodeURIComponent(item.poster_path)}`}
                                    alt={item.title}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="recently-added-no-poster">🎬</div>
                            )}
                        </div>
                    ))
                }
            </div>
        </div>
    );
}
