import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    // Close menu on route change
    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                <span className="navbar-brand-icon">🎬</span>
                JakePlex
            </Link>

            {/* Hamburger button — visible only on mobile via CSS */}
            <button
                className={`hamburger ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle menu"
            >
                <span />
                <span />
                <span />
            </button>

            {/* Desktop links (hidden on mobile via CSS) */}
            <div className="navbar-links navbar-links-desktop">
                <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                <Link to="/library" className={`navbar-link ${location.pathname === '/library' ? 'active' : ''}`}>On Plex</Link>
                <Link to="/instructions" className={`navbar-link ${location.pathname === '/instructions' ? 'active' : ''}`}>Instructions</Link>
                <Link to="/admin" className={`navbar-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>
            </div>

            {/* Mobile overlay + drawer */}
            {menuOpen && <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)} />}
            <div className={`mobile-nav ${menuOpen ? 'open' : ''}`}>
                <Link to="/" className={`mobile-nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                <Link to="/library" className={`mobile-nav-link ${location.pathname === '/library' ? 'active' : ''}`}>On Plex</Link>
                <Link to="/instructions" className={`mobile-nav-link ${location.pathname === '/instructions' ? 'active' : ''}`}>Instructions</Link>
                <Link to="/admin" className={`mobile-nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}>Admin</Link>
            </div>
        </nav>
    );
}
