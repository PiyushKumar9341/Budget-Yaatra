import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AuthContext = createContext({
    user: null,
    loading: true,
    isAuthModalOpen: false,
    openAuthModal: () => {},
    closeAuthModal: () => {},
    sendOtp: async () => {},
    verifyOtp: async () => {},
    logout: () => {},
    refresh: () => {},
});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const openAuthModal = () => setIsAuthModalOpen(true);
    const closeAuthModal = () => setIsAuthModalOpen(false);

    const checkAuth = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
            setUser(res.data);
        } catch (err) {
            if (err?.response?.status && err.response.status !== 401) {
                console.warn("[AuthContext] /auth/me failed:", err?.message || err);
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const sendOtp = async (phone_number) => {
        const res = await axios.post(`${API}/auth/send-otp`, { phone_number });
        return res.data;
    };

    const verifyOtp = async (phone_number, otp, name) => {
        const res = await axios.post(`${API}/auth/verify-otp`, { phone_number, otp, name }, { withCredentials: true });
        setUser(res.data.user);
        return res.data;
    };

    const logout = async () => {
        try {
            await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
        } catch {}
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthModalOpen,
                openAuthModal,
                closeAuthModal,
                sendOtp,
                verifyOtp,
                logout,
                refresh: checkAuth,
                setUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
