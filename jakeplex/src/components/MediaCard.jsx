import { useNavigate } from 'react-router-dom';

const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

export default function MediaCard({ item, index }) {
    const navigate = useNavigate();
    const title = item.title || item.name;
    const year = (item.release_date || item.first_air_date || '').slice(0, 4);
    const mediaType = item.media_type;

    const handleClick = () => {
        navigate(`/${mediaType}/${item.id}`);
    };

    return (
        <div
            className="media-card"
            onClick={handleClick}
            style={{ animationDelay: `${index * 60}ms` }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            {item._isOnPlex && (
                <div className="on-plex-badge" title="Already on Plex">
                    ✓
                </div>
            )}
            {item.poster_path ? (
                <img
                    className="media-card-poster"
                    src={`${IMG_BASE}${item.poster_path}`}
                    alt={title}
                    loading="lazy"
                />
            ) : (
                <div className="media-card-no-poster">🎬</div>
            )}
            <div className="media-card-overlay">
                <div className="media-card-title">{title}</div>
                <div className="media-card-meta">
                    {year && <span>{year}</span>}
                    <span className={`badge badge-${mediaType}`}>
                        {mediaType === 'movie' ? 'Movie' : 'TV'}
                    </span>
                </div>
            </div>
        </div>
    );
}
