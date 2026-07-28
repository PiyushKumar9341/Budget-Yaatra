import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Heart, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MyTripsPage() {
    const { user, loading } = useAuth();
    const { setDestination } = useTheme();
    const [wishlist, setWishlist] = useState([]);
    const [trips, setTrips] = useState([]);

    useEffect(() => { setDestination("base"); }, [setDestination]);

    useEffect(() => {
        if (!user) return;
        axios.get(`${API}/wishlist`, { withCredentials: true }).then((r) => setWishlist(r.data));
        axios.get(`${API}/trip/mine`, { withCredentials: true }).then((r) => setTrips(r.data));
    }, [user]);

    if (loading) return <div className="p-20 text-center opacity-60">Loading…</div>;
    if (!user) return (
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
            <h1 className="font-display text-5xl tracking-tighter">Sign in first</h1>
            <p className="font-editorial-italic text-xl mt-4 opacity-70">Login karo aur apni saved yatras yaha dekho.</p>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
            <h1 className="font-display text-5xl md:text-7xl tracking-tighter" data-testid="mytrips-heading">
                Aapki <span className="font-editorial-italic font-normal">yatras</span>
            </h1>
            <p className="font-editorial-italic text-xl opacity-70 mt-2">Namaste, {user.name?.split(" ")[0]} 🙏</p>

            <section className="mt-14">
                <h2 className="font-display text-3xl tracking-tight mb-6 flex items-center gap-2"><Heart className="w-6 h-6" /> Wishlist</h2>
                {wishlist.length === 0 ? (
                    <p className="opacity-60">No saved destinations yet. Explore some and save your favourites.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="wishlist-grid">
                        {wishlist.map((d) => (
                            <Link key={d.slug} to={`/destination/${d.slug}`} className="relative overflow-hidden rounded-3xl h-56 block group">
                                <img src={d.hero_image} alt={d.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.7))" }} />
                                <div className="absolute inset-0 p-5 flex flex-col justify-end text-white">
                                    <p className="text-xs uppercase tracking-widest opacity-80">{d.state}</p>
                                    <h3 className="font-display text-3xl tracking-tight">{d.name}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            <section className="mt-16">
                <h2 className="font-display text-3xl tracking-tight mb-6 flex items-center gap-2"><Sparkles className="w-6 h-6" /> Saved AI Plans</h2>
                {trips.length === 0 ? (
                    <p className="opacity-60">No AI plans saved yet. <Link to="/planner" className="underline">Try the planner</Link>.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="trips-grid">
                        {trips.map((t) => (
                            <div key={t.trip_id} className="by-card">
                                <p className="text-xs uppercase tracking-widest opacity-60">{new Date(t.created_at).toLocaleDateString()}</p>
                                <h3 className="font-display text-2xl mt-1 tracking-tight">{t.plan.title}</h3>
                                <p className="font-editorial-italic mt-2 opacity-80">{t.plan.summary}</p>
                                <p className="mt-3 text-sm">₹{t.plan.total_estimated_cost?.toLocaleString("en-IN")} · {t.plan.days?.length} days · {t.plan.destination?.name}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
