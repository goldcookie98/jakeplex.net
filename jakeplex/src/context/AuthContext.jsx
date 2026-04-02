import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const PLEX_CLIENT_ID = 'jakeplex-' + Math.random().toString(36).substring(2, 15);
const APP_NAME = 'JakePlex';

export function AuthProvider({ children }) {
    const [plexUser, setPlexUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const headers = {
        'Accept': 'application/json',
        'X-Plex-Client-Identifier': PLEX_CLIENT_ID,
        'X-Plex-Product': APP_NAME,
        'X-Plex-Version': '1.0'
    };

    useEffect(() => {
        const checkToken = async () => {
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

        checkToken();
    }, []);

    const logout = () => {
        localStorage.removeItem('plex_token');
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
            
            // 2. Open login window
            const authUrl = `https://app.plex.tv/auth/#!?clientID=${PLEX_CLIENT_ID}&code=${pinData.code}&context[device][product]=${encodeURIComponent(APP_NAME)}`;
            const popup = window.open(authUrl, 'PlexAuth', 'width=600,height=700');
            
            // 3. Poll for token
            return new Promise((resolve, reject) => {
                let pollInterval;
                const checkPin = async () => {
                    if (popup && popup.closed) {
                        clearInterval(pollInterval);
                        reject(new Error("Login window closed"));
                        return;
                    }

                    try {
                        const checkRes = await fetch(`https://plex.tv/api/v2/pins/${pinData.id}`, { headers });
                        const checkData = await checkRes.json();
                        
                        if (checkData.authToken) {
                            clearInterval(pollInterval);
                            if (popup) popup.close();
                            
                            localStorage.setItem('plex_token', checkData.authToken);
                            
                            // Fetch user info immediately
                            const userRes = await fetch('https://plex.tv/api/v2/user', {
                                headers: { ...headers, 'X-Plex-Token': checkData.authToken }
                            });
                            
                            if (userRes.ok) {
                                const userData = await userRes.json();
                                setPlexUser({
                                    username: userData.username,
                                    email: userData.email,
                                    thumb: userData.thumb,
                                    token: checkData.authToken
                                });
                                resolve(true);
                            } else {
                                reject(new Error("Failed to fetch user details."));
                            }
                        }
                    } catch (e) {
                         // wait for next poll
                    }
                };

                pollInterval = setInterval(checkPin, 2000);
                
                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(pollInterval);
                    reject(new Error("Login timed out"));
                }, 5 * 60 * 1000);
            });
            
        } catch (error) {
            console.error("Plex Login Initialization Failed:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ plexUser, isLoading, loginWithPlex, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
