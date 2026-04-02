import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const IMG_BASE = 'https://image.tmdb.org/t/p';

export default function MyRequests() {
    const { plexUser, logout } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!plexUser) {
            navigate('/');
            return;
        }

        const fetchMyRequests = async () => {
            try {
                const res = await fetch('/api/requests/me', {
                    headers: { 'Authorization': `Bearer ${plexUser.token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Sort pending to top, then newest
                    data.sort((a, b) => {
                        if (a.status === 'pending' && b.status !== 'pending') return -1;
                        if (b.status === 'pending' && a.status !== 'pending') return 1;
                        return new Date(b.created_at) - new Date(a.created_at);
                    });
                    setRequests(data);
                }
            } catch (err) {
                console.error("Failed to fetch my requests", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyRequests();
    }, [plexUser, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    if (!plexUser) return null;

    return (
        <div className="page">
            <div className="container dashboard">
                <div className="dashboard-header" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {plexUser.thumb ? (
                            <img src={plexUser.thumb} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                        ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                                {plexUser.username.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 style={{ fontSize: '1.8rem', margin: 0 }}>My Requests</h1>
                            <span style={{ color: 'var(--text-muted)' }}>{plexUser.email || plexUser.username}</span>
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={handleLogout}>Sign Out</button>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🍿</div>
                        <h3>No requests yet</h3>
                        <p>Go search for a movie or TV show to request it!</p>
                    </div>
                ) : (
                    <div className="requests-table-wrapper" style={{ marginTop: '24px' }}>
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>Media</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.id}>
                                        <td className="request-row-media">
                                            {req.poster_path ? (
                                                <img
                                                    src={`${IMG_BASE}/w92${req.poster_path}`}
                                                    alt={req.title}
                                                    className="request-row-poster"
                                                />
                                            ) : (
                                                <div className="request-row-poster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎬</div>
                                            )}
                                            <div>
                                                <div className="request-row-title">{req.title}</div>
                                                <div className="request-row-year">
                                                    {req.year} • {req.media_type === 'movie' ? 'Movie' : 'TV Show'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ 
                                                padding: '4px 10px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 'bold',
                                                textTransform: 'uppercase',
                                                background: req.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 
                                                          req.status === 'declined' ? 'rgba(239, 68, 68, 0.2)' : 
                                                          'rgba(234, 179, 8, 0.2)',
                                                color: req.status === 'approved' ? '#4ade80' : 
                                                       req.status === 'declined' ? '#f87171' : 
                                                       '#facc15'
                                            }}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
