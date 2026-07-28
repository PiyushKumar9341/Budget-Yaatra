import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Mountain, Heart, User, LogOut } from "lucide-react";
import Footer from "@/components/Footer";

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogin = () => {
        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        const redirectUrl = window.location.origin + "/";
        window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    };

    return (
        <div className="grain min-h-screen">
            <header className="glass sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
                    <Link to="/" data-testid="logo-link" className="flex items-center gap-2 group">
                        <Mountain className="w-6 h-6 transition-transform duration-500 group-hover:-translate-y-1" style={{ color: "rgb(var(--by-primary))" }} />
                        <span className="font-display text-2xl tracking-tighter">Budget Yaatra</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 font-editorial text-lg">
                        <Link data-testid="nav-explore" to="/" className="link-underline">Explore</Link>
                        <Link data-testid="nav-planner" to="/planner" className="link-underline">Plan a Yatra</Link>
                        <Link data-testid="nav-stories" to="/stories" className="link-underline">Stories</Link>
                        {user && <Link data-testid="nav-mine" to="/mine" className="link-underline">My Trips</Link>}
                    </nav>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link to="/mine" data-testid="wishlist-link" className="p-2 hover:opacity-70" title="My Trips">
                                    <Heart className="w-5 h-5" />
                                </Link>
                                <div className="flex items-center gap-2">
                                    {user.picture ? (
                                        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-black/10" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgb(var(--by-accent))" }}>
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                    <button onClick={() => { logout(); navigate("/"); }} data-testid="logout-btn" className="p-2 hover:opacity-70" title="Logout">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button onClick={handleLogin} data-testid="login-btn" className="pill-btn ghost text-sm">
                                Sign in with Google
                            </button>
                        )}
                    </div>
                </div>
            </header>
            <main>{children}</main>
            <Footer />
        </div>
    );
}
