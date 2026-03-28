export default function Instructions() {
    return (
        <div className="page">
            <div className="container" style={{ paddingTop: '24px' }}>
                <div className="results-header" style={{ marginBottom: '24px' }}>
                    <h2>Instructions</h2>
                </div>

                <div className="media-card" style={{ padding: '32px', backgroundColor: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>Quality & Speed</h3>
                    <p style={{ marginBottom: '32px', lineHeight: '1.6' }}>
                        All media is at <strong>1080p or 4K</strong>. All requests will be completed fast.
                    </p>

                    <h3 style={{ marginBottom: '16px', color: 'var(--accent-primary)', fontSize: '1.2rem' }}>How to Setup Plex</h3>
                    <ol style={{ marginLeft: '24px', lineHeight: '1.8', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li>You need a Plex account. If you don't have one, create one at <a href="https://plex.tv" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-secondary)' }}>plex.tv</a>.</li>
                        <li>To add the account, add this username as a friend: <strong>goldco76</strong></li>
                        <li>Click the link in the invitation email you receive.</li>
                        <li>Sign in to your Plex account through that link.</li>
                        <li>You will then have access! <em>(Note: You will most likely have to refresh the Plex app or refresh your browser tab to see the library.)</em></li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
