import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Heart, MessageCircle, MapPin, Utensils, BedDouble, Star, Calendar, Wallet, Bike, UserRound, Phone, CloudSun, Car, Thermometer, Luggage } from "lucide-react";
import ChatDrawer from "@/components/ChatDrawer";
import ReviewForm from "@/components/ReviewForm";
import PartnerRateModal from "@/components/PartnerRateModal";
import CabPoolModal from "@/components/CabPoolModal";
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
    const { user, openAuthModal } = useAuth();
    const [dest, setDest] = useState(null);
    const [weather, setWeather] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [stories, setStories] = useState([]);
    const [chatOpen, setChatOpen] = useState(false);
    const [cabPoolOpen, setCabPoolOpen] = useState(false);
    const [inWishlist, setInWishlist] = useState(false);
    const [partnerRatings, setPartnerRatings] = useState({});
    const [rateTarget, setRateTarget] = useState(null); // {type, name}

    const fetchRatings = () => {
        axios.get(`${API}/destinations/${slug}/partner-ratings`).then((r) => setPartnerRatings(r.data)).catch(() => {});
    };

    useEffect(() => {
        setDestination(slug);
        axios.get(`${API}/destinations/${slug}`).then((r) => setDest(r.data)).catch(() => {});
        axios.get(`${API}/weather/${slug}`).then((r) => setWeather(r.data)).catch(() => {});
        axios.get(`${API}/destinations/${slug}/reviews`).then((r) => setReviews(r.data)).catch(() => {});
        axios.get(`${API}/stories?destination_slug=${slug}`).then((r) => setStories(r.data.slice(0, 3))).catch(() => {});
        fetchRatings();
        return () => setDestination("base");
    }, [slug, setDestination]);


    useEffect(() => {
        if (!user) return setInWishlist(false);
        axios.get(`${API}/wishlist`, { withCredentials: true }).then((r) => {
            setInWishlist(r.data.some((d) => d.slug === slug));
        }).catch(() => {});
    }, [user, slug]);

    const toggleWishlist = async () => {
        if (!user) {
            toast.error("Please sign in to save trips");
            openAuthModal();
            return;
        }
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
                        <button onClick={() => setCabPoolOpen(true)} className="pill-btn" style={{ background: "#e8873a", color: "white", borderColor: "transparent" }}>
                            <Car className="w-4 h-4" /> Yaatri Pool (Cab Share)
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

            {/* QUICK STATS & WEATHER WIDGET */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    <Stat icon={Calendar} label="Best season" value={dest.best_season} />
                    <Stat icon={Wallet} label="Budget/day" value={`₹${dest.budget_per_day}`} />
                    <Stat icon={MapPin} label="Region" value={dest.region} />
                    <Stat icon={Star} label="Vibe" value={dest.vibe.split(",")[0]} />
                </div>

                {weather && (
                    <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                                <CloudSun className="w-8 h-8" />
                            </div>
                            <div>
                                <span className="text-xs uppercase tracking-widest text-stone-400">Current Weather & Climate</span>
                                <div className="flex items-baseline gap-3 mt-1">
                                    <span className="font-display text-4xl text-stone-100">{weather.temp}</span>
                                    <span className="text-emerald-400 font-semibold text-base">{weather.condition}</span>
                                </div>
                                <p className="text-xs text-stone-400 mt-1">Humidity: {weather.humidity} · Peak Season: {weather.best_months}</p>
                            </div>
                        </div>

                        {weather.packing?.length > 0 && (
                            <div className="bg-stone-800/40 border border-stone-800/80 rounded-2xl p-4 max-w-md w-full">
                                <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5 mb-2">
                                    <Luggage className="w-3.5 h-3.5 text-emerald-400" /> Recommended Packing Essentials
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {weather.packing.map((item, idx) => (
                                        <span key={idx} className="text-[11px] px-2.5 py-1 bg-stone-800 border border-stone-700/60 rounded-lg text-stone-300">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
                    <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Authentic Local Stays</h2>
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
                    <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Local Food & Eateries</h2>
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

            {/* RENTALS */}
            {dest.rentals?.length > 0 && (
                <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="font-editorial-italic opacity-70">Local Transport Options</p>
                            <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Rent a Ride</h2>
                        </div>
                        <p className="font-editorial-italic opacity-70 hidden md:block">Bikes, autos, cabs — union rate, no commission</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="rentals-grid">
                        {dest.rentals.map((r, i) => (
                            <PartnerCard
                                key={i}
                                partner={r}
                                type="rental"
                                icon={Bike}
                                iconLabel={r.type}
                                titleField="name"
                                subtitleField="vehicle"
                                priceField="price_per_day"
                                destName={dest.name}
                                slug={slug}
                                userAvailable={!!user}
                                rating={partnerRatings[r.name]}
                                onRate={() => setRateTarget({ type: "rental", name: r.name })}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* GUIDES */}
            {dest.guides?.length > 0 && (
                <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <p className="font-editorial-italic opacity-70">Storytellers & Cultural Experts</p>
                            <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Verified Local Guides</h2>
                        </div>
                        <p className="font-editorial-italic opacity-70 hidden md:block">Real locals · real stories</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="guides-grid">
                        {dest.guides.map((g, i) => (
                            <PartnerCard
                                key={i}
                                partner={g}
                                type="guide"
                                icon={UserRound}
                                iconLabel="Local guide"
                                titleField="name"
                                subtitleField="specialty"
                                priceField="price_per_day"
                                extraInfo={`Speaks: ${g.languages}`}
                                destName={dest.name}
                                slug={slug}
                                userAvailable={!!user}
                                rating={partnerRatings[g.name]}
                                onRate={() => setRateTarget({ type: "guide", name: g.name })}
                            />
                        ))}
                    </div>
                </section>
            )}

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
                        {dest.rentals?.map((r, i) => (
                            <Marker key={`r${i}`} position={[r.lat, r.lng]} icon={makeIcon("#e8873a")}>
                                <Popup><b>{r.name}</b><br />{r.vehicle} · ₹{r.price_per_day}/day</Popup>
                            </Marker>
                        ))}
                        {dest.guides?.map((g, i) => (
                            <Marker key={`g${i}`} position={[g.lat, g.lng]} icon={makeIcon("#6b46c1")}>
                                <Popup><b>{g.name}</b><br />{g.specialty} · ₹{g.price_per_day}/day</Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
                <p className="mt-3 text-xs opacity-60 font-editorial-italic">Colored pins = stays · Dark = food · Orange = rentals · Purple = guides</p>
            </section>

            {/* REVIEWS */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-16">
                <div className="flex items-end justify-between mb-8">
                    <h2 className="font-display text-4xl md:text-5xl tracking-tighter">Genuine yatri stories</h2>
                    <p className="font-editorial-italic opacity-70 hidden md:block">Only from real travellers who logged in</p>
                </div>

                {/* Community Stories preview */}
                {(stories.length > 0 || user) && (
                    <div className="mb-10">
                        <div className="flex items-end justify-between mb-4">
                            <p className="font-editorial-italic text-xl opacity-80">Long-form yatri diaries</p>
                            <div className="flex gap-3">
                                {user && (
                                    <Link to={`/stories/new?dest=${slug}`} data-testid="write-story-from-dest" className="text-sm underline opacity-80 hover:opacity-100">
                                        Write yours →
                                    </Link>
                                )}
                                {stories.length > 0 && (
                                    <Link to={`/stories?dest=${slug}`} className="text-sm underline opacity-80 hover:opacity-100">
                                        See all →
                                    </Link>
                                )}
                            </div>
                        </div>
                        {stories.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5" data-testid="dest-stories">
                                {stories.map((s) => (
                                    <Link key={s.story_id} to={`/stories/${s.story_id}`} className="by-card block group">
                                        <div className="relative overflow-hidden rounded-2xl h-36 mb-3 -mx-2 -mt-2">
                                            <img src={s.cover_image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        </div>
                                        <p className="text-xs uppercase tracking-widest opacity-60">{s.read_time_min} min · {s.author_name}</p>
                                        <h4 className="font-display text-xl tracking-tight mt-1 group-hover:italic transition-all">{s.title}</h4>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="by-card text-center py-8">
                                <p className="font-editorial-italic opacity-70">No long-form stories yet for {dest.name}.</p>
                                <Link to={`/stories/new?dest=${slug}`} className="pill-btn mt-4 inline-flex">Write the first one</Link>
                            </div>
                        )}
                    </div>
                )}

                {user ? (
                    <ReviewForm slug={slug} onCreated={(r) => setReviews([r, ...reviews])} />
                ) : (
                    <div className="by-card mb-8 text-center py-8 cursor-pointer" onClick={openAuthModal}>
                        <p className="font-editorial-italic opacity-80 text-lg">Sign in to share your yatra story ✍️</p>
                        <button className="pill-btn text-xs mt-3">Sign in</button>
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
            <CabPoolModal destinationSlug={slug} destinationName={dest.name} isOpen={cabPoolOpen} onClose={() => setCabPoolOpen(false)} />
            {rateTarget && (
                <PartnerRateModal
                    open={!!rateTarget}
                    onClose={() => setRateTarget(null)}
                    destinationSlug={slug}
                    partnerType={rateTarget.type}
                    partnerName={rateTarget.name}
                    onSaved={fetchRatings}
                />
            )}
        </div>
    );
}

function PartnerCard({ partner, type, icon: Icon, iconLabel, subtitleField, priceField, extraInfo, destName, slug, userAvailable, rating, onRate }) {
    const [revealed, setRevealed] = useState(null); // {phone, name}
    const [revealing, setRevealing] = useState(false);

    const revealAndOpenWA = async () => {
        if (!userAvailable) { toast.error("Sign in with mobile to contact local partners"); return; }
        if (revealing) return;
        setRevealing(true);
        try {
            const r = await axios.post(`${API}/partners/reveal`, {
                destination_slug: slug,
                partner_type: type,
                partner_name: partner.name,
            }, { withCredentials: true });
            setRevealed(r.data);
            const digits = (r.data.phone || "").replace(/[^0-9]/g, "");
            const text = encodeURIComponent(
                `Namaste! I found you on Budget Yatra (budgetyatra.in) — planning a trip to ${destName}. Interested in your ${type === "rental" ? partner.vehicle : partner.specialty}. Available in the coming days?`
            );
            window.open(`https://wa.me/${digits}?text=${text}`, "_blank");
        } catch (e) {
            toast.error("Could not reveal contact. Try again.");
        } finally { setRevealing(false); }
    };

    const rgb = getComputedStyle(document.documentElement).getPropertyValue("--by-primary").trim();
    return (
        <div className="by-card" data-testid={`partner-card-${type}-${partner.name.replace(/\s+/g, "-").toLowerCase().slice(0, 20)}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-60">
                    <Icon className="w-4 h-4" /> {iconLabel}
                </div>
                {rating && (
                    <div className="flex items-center gap-1 text-xs" title={`${rating.count} ratings`}>
                        <Star className="w-3.5 h-3.5 fill-current" style={{ color: `rgb(${rgb})` }} />
                        <span className="font-display">{rating.avg}</span>
                        <span className="opacity-60">({rating.count})</span>
                    </div>
                )}
            </div>
            <h3 className="font-display text-2xl tracking-tight">{partner.name}</h3>
            <p className="font-editorial mt-2 text-lg">{partner[subtitleField]}</p>
            <p className="font-editorial-italic mt-2 opacity-70 text-sm">{partner.note}</p>

            {/* contact — hidden until revealed via auth-gated endpoint */}
            {revealed?.phone ? (
                <div className="mt-3 flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5" style={{ color: `rgb(${rgb})` }} />
                    <span className="font-display">{revealed.phone}</span>
                    <span className="text-xs opacity-60 font-editorial-italic">· revealed</span>
                </div>
            ) : (
                <div className="mt-3 flex items-center gap-2 text-sm opacity-60">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="font-editorial-italic">Contact hidden · sign in to reveal</span>
                </div>
            )}

            <div className="mt-4 flex items-center justify-between text-sm">
                <span>{extraInfo}</span>
                <span><span className="font-display text-xl">₹{partner[priceField]}</span><span className="opacity-60"> /day</span></span>
            </div>

            <div className="mt-5 flex gap-2">
                <button
                    onClick={revealAndOpenWA}
                    disabled={revealing}
                    data-testid={`wa-book-${type}`}
                    className="pill-btn py-2 px-4 text-sm flex-1 justify-center disabled:opacity-60"
                    style={{ background: "#25D366", borderColor: "#25D366", color: "white" }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.85 11.85 0 0012.06 0C5.5 0 .17 5.32.17 11.87c0 2.09.55 4.13 1.6 5.93L0 24l6.35-1.66a11.87 11.87 0 005.71 1.45h.01c6.55 0 11.88-5.32 11.88-11.87 0-3.17-1.23-6.15-3.43-8.44zM12.06 21.79h-.01a9.9 9.9 0 01-5.05-1.38l-.36-.22-3.77.99 1-3.67-.23-.38a9.86 9.86 0 01-1.52-5.26c0-5.45 4.43-9.88 9.88-9.88 2.64 0 5.12 1.03 6.99 2.9a9.79 9.79 0 012.9 6.99c0 5.45-4.43 9.87-9.83 9.87z"/></svg>
                    {revealing ? "Revealing..." : revealed ? "Open WhatsApp" : "Reveal & Book on WhatsApp"}
                </button>
                <button
                    onClick={() => {
                        if (!userAvailable) { toast.error("Sign in to rate partners"); return; }
                        onRate();
                    }}
                    data-testid={`rate-${type}`}
                    className="pill-btn ghost py-2 px-4 text-sm"
                >
                    <Star className="w-3.5 h-3.5" /> Rate
                </button>
            </div>

            {rating?.recent?.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2 text-xs" style={{ borderColor: "rgb(var(--by-text) / 0.08)" }}>
                    {rating.recent.slice(-2).map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                            {r.user_picture && <img src={r.user_picture} alt="" className="w-5 h-5 rounded-full mt-0.5" />}
                            <div className="flex-1">
                                <div className="flex items-center gap-1 opacity-70">
                                    <span className="font-medium">{r.user_name}</span>
                                    <span>· {r.rating}★</span>
                                </div>
                                {r.comment && <p className="font-editorial-italic opacity-80">{r.comment}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
