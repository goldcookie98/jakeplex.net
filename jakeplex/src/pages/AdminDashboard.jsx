import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const IMG_BASE = 'https://image.tmdb.org/t/p/w92';

export default function AdminDashboard() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const navigate = useNavigate();
    const { addToast } = useToast();

    const token = localStorage.getItem('jakeplex_token');

    useEffect(() => {
        if (!token) {
            navigate('/admin', { replace: true });
            return;
        }
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            // First, trigger auto-detect for any pending requests
            try {
                const autoRes = await fetch('/api/requests/auto-detect', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
                const autoData = await autoRes.json();
                if (autoData.updated && autoData.updated.length > 0) {
                    addToast(`Auto-approved ${autoData.updated.length} item(s) found on Plex!`, 'success');
                }
            } catch (err) {
                console.error('Auto-detect failed:', err);
                // Non-fatal, continue to fetch requests
            }

            // Then fetch the (potentially updated) list of requests
            const res = await fetch('/api/requests', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('jakeplex_token');
                navigate('/admin', { replace: true });
                return;
            }

            const data = await res.json();
            setRequests(data);
        } catch (err) {
            addToast('Failed to load requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await fetch(`/api/requests/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            setRequests((prev) =>
                prev.map((r) => (r.id === id ? { ...r, status } : r))
            );
            addToast(`Request ${status}`, 'success');
        } catch (err) {
            addToast('Failed to update request', 'error');
        }
    };

    const deleteReq = async (id) => {
        try {
            await fetch(`/api/requests/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests((prev) => prev.filter((r) => r.id !== id));
            addToast('Request deleted', 'success');
        } catch (err) {
            addToast('Failed to delete request', 'error');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jakeplex_token');
        navigate('/admin', { replace: true });
    };

    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    const approvedCount = requests.filter((r) => r.status === 'approved').length;
    const declinedCount = requests.filter((r) => r.status === 'declined').length;

    const filteredRequests = requests.filter((req) => {
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesType = typeFilter === 'all' || req.media_type === typeFilter;
        return matchesStatus && matchesType;
    });

    if (loading) {
        return (
            <div className="page">
                <div className="loading" style={{ minHeight: '60vh' }}>
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container dashboard">
                <div className="dashboard-header">
                    <h1>Request Dashboard</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="dashboard-stats">
                            <div className="stat-card">
                                <div className="stat-number">{pendingCount}</div>
                                <div className="stat-label">Pending</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{approvedCount}</div>
                                <div className="stat-label">Approved</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-number">{declinedCount}</div>
                                <div className="stat-label">Declined</div>
                            </div>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                            Logout
                        </button>
                    </div>
                </div>

                <div className="filter-bar">
                    <div className="filter-group">
                        <span className="filter-label">Status:</span>
                        <div className="filter-chips">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'pending', label: 'Pending' },
                                { id: 'approved', label: 'Installed' },
                                { id: 'declined', label: 'Declined' }
                            ].map(status => (
                                <button
                                    key={status.id}
                                    className={`filter-chip ${statusFilter === status.id ? 'active' : ''}`}
                                    onClick={() => setStatusFilter(status.id)}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="filter-group">
                        <span className="filter-label">Type:</span>
                        <div className="filter-chips">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'movie', label: 'Movies' },
                                { id: 'tv', label: 'TV' }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    className={`filter-chip ${typeFilter === type.id ? 'active' : ''}`}
                                    onClick={() => setTypeFilter(type.id)}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredRequests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h3>No matching requests</h3>
                        <p>Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="requests-table-wrapper">
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Requested By</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((req) => (
                                    <tr key={req.id}>
                                        <td data-label="Title">
                                            <div className="request-row-media">
                                                {req.poster_path ? (
                                                    <img
                                                        className="request-row-poster"
                                                        src={`${IMG_BASE}${req.poster_path}`}
                                                        alt={req.title}
                                                    />
                                                ) : (
                                                    <div
                                                        className="request-row-poster"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1.2rem',
                                                        }}
                                                    >
                                                        🎬
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="request-row-title">{req.title}</div>
                                                    {req.year && (
                                                        <div className="request-row-year">{req.year}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Type">
                                            <span className={`badge badge-${req.media_type}`}>
                                                {req.media_type === 'movie' ? 'Movie' : 'TV'}
                                            </span>
                                        </td>
                                        <td className="truncate-cell" data-label="Requested By" style={{ fontWeight: 500, color: 'var(--accent-secondary)' }}>
                                            {req.requested_by || 'Anonymous'}
                                        </td>
                                        <td data-label="Status">
                                            <span className={`badge badge-${req.status}`}>
                                                {req.status === 'approved' ? 'installed' : req.status}
                                            </span>
                                        </td>
                                        <td data-label="Date" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {new Date(req.requested_at).toLocaleDateString('en-GB', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td data-label="Actions">
                                            <div className="request-row-actions">
                                                {req.status !== 'approved' && (
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => updateStatus(req.id, 'approved')}
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {req.status !== 'declined' && (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => updateStatus(req.id, 'declined')}
                                                    >
                                                        Decline
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => deleteReq(req.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
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
