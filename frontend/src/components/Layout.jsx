import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Mountain, Heart, User, LogOut } from "lucide-react";
import Footer from "@/components/Footer";

export default function Layout({ children }) {
    const { user, logout, openAuthModal } = useAuth();
    const navigate = useNavigate();

    const [isVisible, setIsVisible] = useState(true);
    const [isAtTop, setIsAtTop] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setIsAtTop(currentScrollY < 30);

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                // Scroll down -> hide header
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                // Scroll up -> show header
                setIsVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="grain min-h-screen">
            {/* Smart Floating Header (Hides on Scroll Down, Shows on Scroll Up) */}
            <header 
                className={`fixed top-0 left-0 right-0 z-50 px-4 md:px-8 pt-3 pb-2 transition-transform duration-500 ease-in-out ${
                    isVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
                }`}
            >
                <div 
                    className="max-w-[1320px] mx-auto px-6 py-3 rounded-full flex items-center justify-between border transition-all duration-300"
                    style={{
                        background: isAtTop ? "rgba(253, 250, 244, 0.12)" : "rgba(253, 250, 244, 0.45)",
                        backdropFilter: "blur(16px) saturate(180%)",
                        WebkitBackdropFilter: "blur(16px) saturate(180%)",
                        borderColor: isAtTop ? "rgba(28, 25, 23, 0.05)" : "rgba(28, 25, 23, 0.08)",
                        boxShadow: isAtTop ? "none" : "0 8px 32px rgba(0,0,0,0.04)"
                    }}
                >
                    <Link to="/" data-testid="logo-link" className="flex items-center gap-2.5 group">
                        <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 shadow-sm"
                            style={{ background: "rgb(var(--by-primary) / 0.12)", color: "rgb(var(--by-primary))" }}
                        >
                            <Mountain className="w-5 h-5" />
                        </div>
                        <span className="font-display text-2xl tracking-tighter">Budget Yaatra</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-2 font-editorial text-lg">
                        <Link 
                            data-testid="nav-explore" 
                            to="/" 
                            className="px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-[rgb(var(--by-primary)/0.1)] hover:text-[rgb(var(--by-primary))]"
                        >
                            Explore
                        </Link>
                        <Link 
                            data-testid="nav-planner" 
                            to="/planner" 
                            className="px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-[rgb(var(--by-primary)/0.1)] hover:text-[rgb(var(--by-primary))] flex items-center gap-1.5"
                        >
                            <span>Plan a Yatra</span>
                            <span className="w-2 h-2 rounded-full bg-[rgb(var(--by-primary))] animate-pulse inline-block" />
                        </Link>
                        <Link 
                            data-testid="nav-stories" 
                            to="/stories" 
                            className="px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-[rgb(var(--by-primary)/0.1)] hover:text-[rgb(var(--by-primary))]"
                        >
                            Stories
                        </Link>
                        {user && (
                            <Link 
                                data-testid="nav-mine" 
                                to="/mine" 
                                className="px-4 py-1.5 rounded-full transition-all duration-300 hover:bg-[rgb(var(--by-primary)/0.1)] hover:text-[rgb(var(--by-primary))]"
                            >
                                My Trips
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link to="/mine" data-testid="wishlist-link" className="p-2.5 rounded-full hover:bg-black/5 transition" title="My Trips">
                                    <Heart className="w-5 h-5" />
                                </Link>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-stone-200/50 rounded-full border border-stone-300/50">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs" style={{ background: "rgb(var(--by-primary))", color: "#fff" }}>
                                            <User className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-xs font-semibold font-mono text-stone-800 max-w-[120px] truncate">
                                            {user.name || user.phone_number}
                                        </span>
                                    </div>
                                    <button onClick={() => { logout(); navigate("/"); }} data-testid="logout-btn" className="p-2.5 rounded-full hover:bg-black/5 transition" title="Logout">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button 
                                onClick={openAuthModal} 
                                data-testid="login-btn" 
                                className="pill-btn text-sm py-2.5 px-6 shadow-md hover:shadow-lg transition-all duration-300"
                            >
                                Sign in
                            </button>
                        )}
                    </div>
                </div>
            </header>
            <main className="pt-20 md:pt-24">{children}</main>
            <Footer />
        </div>
    );
}
