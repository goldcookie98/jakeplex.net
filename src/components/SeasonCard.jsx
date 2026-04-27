const IMG_BASE = 'https://image.tmdb.org/t/p/w185';

export default function SeasonCard({ season }) {
    return (
        <div className="season-card">
            {season.poster_path ? (
                <img
                    className="season-card-poster"
                    src={`${IMG_BASE}${season.poster_path}`}
                    alt={season.name}
                    loading="lazy"
                />
            ) : (
                <div className="season-card-poster" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-muted)',
                    fontSize: '2rem',
                }}>
                    📺
                </div>
            )}
            <div className="season-card-info">
                <div className="season-card-name">{season.name}</div>
                <div className="season-card-episodes">
                    {season.episode_count} episode{season.episode_count !== 1 ? 's' : ''}
                </div>
            </div>
        </div>
    );
}
