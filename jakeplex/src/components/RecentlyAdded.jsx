import { useState, useEffect } from 'react';

export default function RecentlyAdded() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    const year = item.year;
                    const mediaType = item.type;
                    
                    return (
                        <div 
                            key={item.id || index}
                            className="recently-added-card"
                            style={{ animationDelay: `${index * 100}ms` }}
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
                            <div className="recently-added-overlay">
                                <div className="recently-added-card-title">{title}</div>
                                <div className="recently-added-meta">
                                    {year && <span>{year}</span>}
                                    <span className={`badge badge-${mediaType === 'movie' ? 'movie' : 'tv'}`}>
                                        {mediaType === 'movie' ? 'Movie' : 'TV'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
