import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

let PLEX_CLIENT_ID = localStorage.getItem('plex_client_id');
if (!PLEX_CLIENT_ID) {
    PLEX_CLIENT_ID = 'jakeplex-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('plex_client_id', PLEX_CLIENT_ID);
}
const APP_NAME = 'JakePlex';

export function AuthProvider({ children }) {
    const [plexUser, setPlexUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const loginWithCustom = async (username, password) => {
        const res = await fetch('/api/auth/custom-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        localStorage.setItem('jakeplex_custom_token', data.token);
        setPlexUser({ username: data.username, token: data.token, thumb: null, email: null, isCustom: true });
        return data;
    };

    const headers = {
        'Accept': 'application/json',
        'X-Plex-Client-Identifier': PLEX_CLIENT_ID,
        'X-Plex-Product': APP_NAME,
        'X-Plex-Version': '1.0'
    };

    useEffect(() => {
        const initializeAuth = async () => {
            setIsLoading(true);
            
            // Check if we just returned from a Plex redirect flow
            const pendingPinId = localStorage.getItem('plex_auth_pin_id');
            if (pendingPinId) {
                try {
                    const checkRes = await fetch(`https://plex.tv/api/v2/pins/${pendingPinId}`, { headers });
                    const checkData = await checkRes.json();
                    
                    if (checkData.authToken) {
                        localStorage.setItem('plex_token', checkData.authToken);
                        // Clean url if we want, or just let routing handle it
                    }
                } catch (e) {
                    console.error("Failed to verify returning Plex PIN", e);
                } finally {
                    localStorage.removeItem('plex_auth_pin_id');
                }
            }

            // Check for saved custom user token
            const customToken = localStorage.getItem('jakeplex_custom_token');
            if (customToken) {
                try {
                    const payload = JSON.parse(atob(customToken.split('.')[1]));
                    if (payload.exp * 1000 > Date.now() && payload.role === 'custom') {
                        setPlexUser({ username: payload.username, token: customToken, thumb: null, email: null, isCustom: true });
                        setIsLoading(false);
                        return;
                    }
                } catch {}
                localStorage.removeItem('jakeplex_custom_token');
            }

            // Normal Plex token check
            const token = localStorage.getItem('plex_token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('https://plex.tv/api/v2/user', {
                    headers: { ...headers, 'X-Plex-Token': token }
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setPlexUser({
                        username: data.username,
                        email: data.email,
                        thumb: data.thumb,
                        token: token
                    });
                } else {
                    localStorage.removeItem('plex_token');
                }
            } catch (error) {
                console.error("Failed to verify Plex token", error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const logout = () => {
        localStorage.removeItem('plex_token');
        localStorage.removeItem('jakeplex_custom_token');
        setPlexUser(null);
    };

    const loginWithPlex = async () => {
        try {
            // 1. Get a PIN
            const pinRes = await fetch('https://plex.tv/api/v2/pins?strong=true', {
                method: 'POST',
                headers
            });
            const pinData = await pinRes.json();
            
            // 2. Save the PIN ID so we can verify it when the user returns
            localStorage.setItem('plex_auth_pin_id', pinData.id);
            
            // 3. Redirect the browser directly to Plex
            // We append a forwardUrl so Plex knows to send them back exactly where they were
            const forwardUrl = encodeURIComponent(window.location.href);
            const authUrl = `https://app.plex.tv/auth/#!?clientID=${PLEX_CLIENT_ID}&code=${pinData.code}&context[device][product]=${encodeURIComponent(APP_NAME)}&forwardUrl=${forwardUrl}`;
            
            window.location.href = authUrl;
            
            // Note: Since we are hard-redirecting the entire webpage, anything below this point 
            // will not execute. The app will reboot entirely when returning.
            // We return a never-resolving promise so the UI loading state stays active until the page unloads.
            return new Promise(() => {});
            
        } catch (error) {
            console.error("Plex Login Initialization Failed:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ plexUser, isLoading, loginWithPlex, loginWithCustom, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
