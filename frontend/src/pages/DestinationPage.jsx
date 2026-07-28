import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Heart, MessageCircle, MapPin, Utensils, BedDouble, Star, Calendar, Wallet } from "lucide-react";
import ChatDrawer from "@/components/ChatDrawer";
import ReviewForm from "@/components/ReviewForm";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// custom leaflet marker
const makeIcon = (color) => L.divIcon({
    className: "",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.25);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
});

export default function DestinationPage() {
    const { slug } = useParams();
    const { setDestination } = useTheme();
    const { user } = useAuth();
    const [dest, setDest] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);

    useEffect(() => {
        setDestination(slug);
        axios.get(`${API}/destinations/${slug}`).then((r) => setDest(r.data)).catch(() => {});
        axios.get(`${API}/destinations/${slug}/reviews`).then((r) => setReviews(r.data)).catch(() => {});
        return () => setDestination("base");
    }, [slug, setDestination]);

    useEffect(() => {
        if (!user) return setInWishlist(false);
        axios.get(`${API}/wishlist`, { withCredentials: true }).then((r) => {
            setInWishlist(r.data.some((d) => d.slug === slug));
        }).catch(() => {});
    }, [user, slug]);

    const toggleWishlist = async () => {
        if (!user) { toast.error("Please sign in to save trips"); return; }
        const res = await axios.post(`${API}/wishlist/${slug}`, {}, { withCredentials: true });
        setInWishlist(res.data.added);
        toast.success(res.data.added ? "Saved to your Yatra" : "Removed");
    };

    if (!dest) return <div className="p-20 text-center opacity-60">Loading destination…</div>;

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue("--by-primary").trim();
    const rgbColor = `rgb(${primaryColor})`;

    return (
        <div>
            {/* HERO */}
            <section className="relative h-[75vh] overflow-hidden">
                <img src={dest.hero_image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)" }} />
                <div className="relative z-10 h-full flex flex-col justify-end pb-16 px-6 md:px-16 max-w-[1400px] mx-auto">
                    <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="font-editorial-italic text-white/90 text-lg md:text-2xl text-shadow-soft">
                        {dest.region} · {dest.state}
                    </motion.p>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-white text-6xl md:text-9xl tracking-tighter leading-none text-shadow-soft" data-testid="dest-heading">
                        {dest.name}
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-editorial-italic text-white text-2xl md:text-3xl mt-4 max-w-3xl text-shadow-soft">
                        {dest.tagline}
                    </motion.p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <button data-testid="wishlist-toggle" onClick={toggleWishlist} className="pill-btn" style={{ background: inWishlist ? rgbColor : "rgba(255,255,255,0.9)", color: inWishlist ? "white" : "#111", borderColor: "transparent" }}>
                            <Heart className={`w-4 h-4 ${inWishlist ? "fill-current" : ""}`} /> {inWishlist ? "Saved" : "Save this Yatra"}
                        </button>
                        <button data-testid="chat-open" onClick={() => setChatOpen(true)} className="pill-btn ghost" style={{ background: "rgba(255,255,255,0.15)", color: "white", borderColor: "rgba(255,255,255,0.35)" }}>
                            <MessageCircle className="w-4 h-4" /> Ask Yatri (AI)
                        </button>
                        <Link to={`/planner?dest=${dest.slug}`} data-testid="plan-here-btn" className="pill-btn" style={{ background: "white", color: "#111", borderColor: "transparent" }}>
                            Plan {dest.name} trip
                        </Link>
                    </div>
                </div>
            </section>

            {/* QUICK STATS */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-5">
                <Stat icon={Calendar} label="Best season" value={dest.best_season} />
                <Stat icon={Wallet} label="Budget/day" value={`₹${dest.budget_per_day}`} />
                <Stat icon={MapPin} label="Region" value={dest.region} />
                <Stat icon={Star} label="Vibe" value={dest.vibe.split(",")[0]} />
            </section>

            {/* HIGHLIGHTS */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-8">
                <h2 className="font-display text-4xl md:text-5xl tracking-tighter mb-8">Must-do</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dest.highlights.map((h, i) => (
                        <div key={i} className="by-card flex items-start gap-4">
                            <span className="font-display text-3xl opacity-40 w-12">{String(i + 1).padStart(2, "0")}</span>
                            <p className="font-editorial text-xl leading-snug pt-1">{h}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* STAYS */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
                <div className="flex items-end justify-between mb-8">
                    <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Roots ke sath so</h2>
                    <p className="font-editorial-italic opacity-70 hidden md:block">Homestays, tents, village homes</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="stays-grid">
                    {dest.stays.map((s, i) => (
                        <div key={i} className="by-card">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 mb-3">
                                <BedDouble className="w-4 h-4" /> {s.type}
                            </div>
                            <h3 className="font-display text-2xl tracking-tight">{s.name}</h3>
                            <p className="font-editorial-italic mt-2 opacity-80">{s.note}</p>
                            <div className="mt-6 flex items-center justify-between">
                                <span className="text-2xl font-display">₹{s.price}<span className="text-xs opacity-60 font-sans"> /night</span></span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FOOD */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
                <div className="flex items-end justify-between mb-8">
                    <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Chhoti dukaan, badi baat</h2>
                    <p className="font-editorial-italic opacity-70 hidden md:block">Local dhabas & family kitchens</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="food-grid">
                    {dest.food_spots.map((f, i) => (
                        <div key={i} className="by-card">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60 mb-3">
                                <Utensils className="w-4 h-4" /> Must-try
                            </div>
                            <h3 className="font-display text-2xl tracking-tight">{f.name}</h3>
                            <p className="font-editorial mt-2 text-lg">{f.dish}</p>
                            <p className="font-editorial-italic mt-2 opacity-70 text-sm">{f.note}</p>
                            <p className="mt-4 text-sm opacity-70">~₹{f.price} per plate</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* MAP */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
                <h2 className="font-display text-4xl md:text-5xl tracking-tighter mb-8">On the map</h2>
                <div className="h-[500px] rounded-3xl overflow-hidden border" style={{ borderColor: "rgb(var(--by-text) / 0.1)" }} data-testid="dest-map">
                    <MapContainer center={[dest.coords.lat, dest.coords.lng]} zoom={9} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">Carto</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        {dest.stays.map((s, i) => (
                            <Marker key={`s${i}`} position={[s.lat, s.lng]} icon={makeIcon(rgbColor)}>
                                <Popup><b>{s.name}</b><br />{s.type} · ₹{s.price}</Popup>
                            </Marker>
                        ))}
                        {dest.food_spots.map((f, i) => (
                            <Marker key={`f${i}`} position={[f.lat, f.lng]} icon={makeIcon("#111")}>
                                <Popup><b>{f.name}</b><br />{f.dish} · ~₹{f.price}</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
                <p className="mt-3 text-xs opacity-60 font-editorial-italic">Colored pins = stays · Dark pins = food spots</p>
            </section>

            {/* REVIEWS */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16">
                <div className="flex items-end justify-between mb-8">
                    <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Genuine yatri stories</h2>
                    <p className="font-editorial-italic opacity-70 hidden md:block">Only from real travellers who logged in</p>
                </div>

                {user ? (
                    <ReviewForm slug={slug} onCreated={(r) => setReviews([r, ...reviews])} />
                ) : (
                    <div className="by-card mb-8 text-center py-8">
                        <p className="font-editorial-italic opacity-80 text-lg">Sign in with Google to share your yatra story ✍️</p>
                    </div>
                )}

                {reviews.length === 0 ? (
                    <p className="opacity-60 mt-4">Be the first to share your story from {dest.name}.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6" data-testid="reviews-list">
                        {reviews.map((r) => (
                            <div key={r.review_id} className="by-card">
                                <div className="flex items-center gap-3 mb-3">
                                    {r.user_picture && <img src={r.user_picture} alt="" className="w-10 h-10 rounded-full" />}
                                    <div>
                                        <p className="font-display text-lg">{r.user_name}</p>
                                        <p className="text-xs opacity-60">{r.visited_month || "Recent"}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-0.5">
                                        {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" style={{ color: rgbColor }} />)}
                                    </div>
                                </div>
                                <p className="font-editorial text-lg leading-relaxed">{r.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} destSlug={slug} destName={dest.name} />
        </div>
    );
}

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="by-card">
            <Icon className="w-5 h-5 opacity-70" />
            <p className="text-xs uppercase tracking-widest opacity-60 mt-2">{label}</p>
            <p className="font-display text-xl md:text-2xl mt-1 tracking-tight">{value}</p>
        </div>
    );
}
