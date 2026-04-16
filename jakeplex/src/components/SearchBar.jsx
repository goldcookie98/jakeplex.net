import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ initialQuery = '', autoFocus = false, compact = false }) {
    const [query, setQuery] = useState(initialQuery);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            navigate(`/search?q=${encodeURIComponent(trimmed)}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="search-bar-wrapper">
            <div className="search-bar">
                <span className="search-bar-icon">🔍</span>
                <input
                    type="search"
                    placeholder="hound dog crying all the time"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus={autoFocus}
                />
                <button type="submit" className="search-bar-btn">
                    Search
                </button>
            </div>
        </form>
    );
}
