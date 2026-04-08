import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecentlyAdded() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
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
            }
        };

        fetchRecent();
    }, []);

    const handleCardClick = async (item) => {
        try {
            // Find the TMDB match
            const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(item.title)}`);
            const data = await res.json();
            
            const tmdbType = item.type === 'show' ? 'tv' : 'movie';
            const results = data.results || [];
            
            // Best match: right media type and matches name
            let bestMatch = results.find(r => {
                if (r.media_type !== tmdbType) return false;
                const rTitle = (r.title || r.name || '').toLowerCase();
                const iTitle = (item.title || '').toLowerCase();
                return rTitle.includes(iTitle) || iTitle.includes(rTitle);
            });
            
            // If no exact title match, just take first of correct type
            if (!bestMatch) {
                bestMatch = results.find(r => r.media_type === tmdbType);
            }
            
            if (bestMatch) {
                navigate(`/${bestMatch.media_type}/${bestMatch.id}`);
            } else {
                navigate(`/search?q=${encodeURIComponent(item.title)}`);
            }
        } catch (err) {
            // Fallback
            navigate(`/search?q=${encodeURIComponent(item.title)}`);
        }
    };

    if (loading) {
        return (
            <div className="recently-added-container">
                <div className="recently-added-loading">Loading new additions...</div>
            </div>
        );
    }

    if (items.length === 0) {
        return null; // hide if empty
    }

    return (
        <div className="recently-added-container">
            <h2 className="recently-added-title">Newly added to Plex</h2>
            <div className="recently-added-grid">
                {items.map((item, index) => {
                    const title = item.title;
                    
                    return (
                        <div 
                            key={item.id || index}
                            className="recently-added-card"
                            style={{ animationDelay: `${index * 100}ms`, cursor: 'pointer' }}
                            onClick={() => handleCardClick(item)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleCardClick(item)}
                        >
                            {item.poster_path ? (
                                <img
                                    className="recently-added-poster"
                                    src={`/api/plex/image?path=${encodeURIComponent(item.poster_path)}`}
                                    alt={title}
                                    loading="lazy"
                                />
                            ) : (
                                <div className="recently-added-no-poster">🎬</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
