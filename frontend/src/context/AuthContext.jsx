import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext({ user: null, loading: true, logout: () => {}, refresh: () => {} });

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // CRITICAL: If returning from OAuth callback, skip the /me check.
        // AuthCallback will exchange the session_id and establish the session first.
        if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
            setLoading(false);
            return;
        }
        checkAuth();
    }, [checkAuth]);

    const logout = async () => {
        try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } catch {}
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, refresh: checkAuth, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
