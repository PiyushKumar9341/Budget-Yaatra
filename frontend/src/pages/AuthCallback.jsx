import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
    const nav = useNavigate();
    const { setUser } = useAuth();
    const hasProcessed = useRef(false);

    useEffect(() => {
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const hash = window.location.hash;
        const params = new URLSearchParams(hash.slice(1));
        const session_id = params.get("session_id");
        if (!session_id) { nav("/", { replace: true }); return; }

        (async () => {
            try {
                const res = await axios.post(`${API}/auth/session`, { session_id }, { withCredentials: true });
                setUser?.(res.data.user);
                window.history.replaceState({}, document.title, "/");
                nav("/", { replace: true, state: { user: res.data.user } });
            } catch (e) {
                nav("/", { replace: true });
            }
        })();
    }, [nav, setUser]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="font-editorial-italic text-xl opacity-70">Signing you in…</p>
        </div>
    );
}
