import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { Search, ArrowUpRight, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ribbonText = "Wander · Discover · Roots · Chhoti Dukaan · Homestays · Local Chai · Hidden Gems · ";

export default function Landing() {
    const { setDestination } = useTheme();
    const [dests, setDests] = useState([]);
    const [query, setQuery] = useState("");
    const nav = useNavigate();

    useEffect(() => {
        setDestination("base");
        axios.get(`${API}/destinations`).then((r) => setDests(r.data)).catch(() => {});
    }, [setDestination]);

    const filtered = query
        ? dests.filter((d) =>
              (d.name + " " + d.state + " " + d.region + " " + d.tagline)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
          )
        : dests;

    const featured = dests.slice(0, 5);

    return (
        <div>
            {/* HERO */}
            <section className="relative h-[92vh] overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1637043765564-a071ff91a09f?auto=format&fit=crop&w=2560&q=90"
                    alt="Meghalaya mist"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 scale-105 hover:scale-100"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.75) 100%)" }} />
                <div className="relative z-10 h-full flex flex-col justify-end pb-20 md:pb-28 px-6 md:px-16 max-w-[1400px] mx-auto">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
                        className="font-editorial-italic text-white/90 text-xl md:text-2xl mb-4 text-shadow-soft"
                    >
                        Not commission. Not chains. Just <span className="not-italic font-editorial font-semibold">India</span>.
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9 }}
                        className="font-display text-white text-5xl md:text-8xl leading-[0.9] max-w-5xl text-shadow-soft"
                        data-testid="hero-heading"
                    >
                        Yatra that<br />actually costs<br />
                        <span className="font-editorial-italic font-normal">less than the memories.</span>
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
                        className="mt-10 max-w-xl bg-white/90 backdrop-blur rounded-full flex items-center gap-3 px-5 py-3 shadow-2xl"
                    >
                        <Search className="w-5 h-5 opacity-60" />
                        <input
                            data-testid="hero-search-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search Meghalaya, Ladakh, Spiti..."
                            className="flex-1 bg-transparent outline-none text-black text-lg placeholder:opacity-50"
                        />
                        <button
                            data-testid="hero-search-submit"
                            onClick={() => filtered[0] && nav(`/destination/${filtered[0].slug}`)}
                            className="pill-btn text-sm py-2 px-4"
                        >
                            Discover
                        </button>
                    </motion.div>
                    {query && filtered.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2 max-w-xl">
                            {filtered.slice(0, 5).map((d) => (
                                <button key={d.slug} onClick={() => nav(`/destination/${d.slug}`)} className="px-4 py-2 rounded-full bg-white/85 text-black text-sm hover:bg-white">
                                    {d.name}, {d.state}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* MARQUEE RIBBON */}
            <div className="py-6 border-y overflow-hidden" style={{ borderColor: "rgb(var(--by-text) / 0.08)" }}>
                <div className="marquee-track font-editorial-italic text-3xl md:text-5xl opacity-80 whitespace-nowrap">
                    <span className="pr-8">{ribbonText.repeat(3)}</span>
                    <span className="pr-8">{ribbonText.repeat(3)}</span>
                </div>
            </div>

            {/* FEATURED BENTO */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-20">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                    <div>
                        <p className="font-editorial-italic text-xl opacity-70">Where the mountains meet the roots</p>
                        <h2 className="font-display text-4xl md:text-6xl tracking-tighter mt-2">Featured destinations</h2>
                    </div>
                    <p className="max-w-md text-sm opacity-70 leading-relaxed">
                        Curated by wanderers, not by commissions. Every homestay, dhaba, and hidden trail here comes with a story — not a sponsorship.
                    </p>
                </div>

                {featured.length === 0 ? (
                    <div className="opacity-60">Loading destinations…</div>
                ) : (
                    <div className="grid grid-cols-12 gap-4 md:gap-6" data-testid="featured-grid">
                        {/* Big feature */}
                        <FeatureCard dest={featured[0]} className="col-span-12 md:col-span-8 md:row-span-2 aspect-[4/3] md:aspect-auto md:h-[560px]" big />
                        {featured[1] && <FeatureCard dest={featured[1]} className="col-span-12 md:col-span-4 h-[270px]" />}
                        {featured[2] && <FeatureCard dest={featured[2]} className="col-span-12 md:col-span-4 h-[270px]" />}
                        {featured[3] && <FeatureCard dest={featured[3]} className="col-span-6 md:col-span-6 h-[300px]" />}
                        {featured[4] && <FeatureCard dest={featured[4]} className="col-span-6 md:col-span-6 h-[300px]" />}
                    </div>
                )}
            </section>

            {/* ALL DESTINATIONS */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 pb-20">
                <h3 className="font-display text-3xl md:text-4xl tracking-tighter mb-8">
                    More <span className="font-editorial-italic font-normal">roots</span> to wander
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5" data-testid="all-destinations-grid">
                    {dests.slice(5).map((d) => (
                        <FeatureCard key={d.slug} dest={d} className="h-[300px]" />
                    ))}
                </div>
            </section>

            {/* AI PLANNER CTA */}
            <section className="max-w-[1400px] mx-auto px-6 md:px-10 pb-24">
                <div className="relative overflow-hidden rounded-[32px] p-10 md:p-16" style={{ background: "rgb(var(--by-secondary))", color: "rgb(var(--by-bg))" }}>
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest mb-6" style={{ background: "rgb(var(--by-bg) / 0.15)" }}>
                            <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini AI
                        </div>
                        <h3 className="font-display text-4xl md:text-6xl tracking-tighter leading-none">
                            Enter your days, budget & vibe.<br />
                            <span className="font-editorial-italic font-normal">Our AI will handle the rest.</span>
                        </h3>
                        <p className="mt-6 opacity-80 max-w-lg leading-relaxed">
                            Day-by-day itineraries built around local tea stalls, family-run homestays, and honest recommendations. Never a commercial chain hotel in sight.
                        </p>
                        <Link to="/planner" data-testid="cta-planner" className="mt-8 inline-flex pill-btn" style={{ background: "rgb(var(--by-bg))", color: "rgb(var(--by-secondary))", borderColor: "transparent" }}>
                            Plan my Trip <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ dest, className = "", big = false }) {
    return (
        <Link
            to={`/destination/${dest.slug}`}
            data-testid={`dest-card-${dest.slug}`}
            className={`relative overflow-hidden rounded-3xl group block ${className}`}
        >
            <img src={dest.hero_image} alt={dest.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-110" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)" }} />
            <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between text-xs uppercase tracking-widest opacity-90">
                    <span>{dest.state}</span>
                    <span>₹{dest.budget_per_day}/day</span>
                </div>
                <div>
                    <h4 className={`font-display ${big ? "text-6xl md:text-8xl" : "text-3xl md:text-4xl"} tracking-tighter leading-none text-shadow-soft`}>
                        {dest.name}
                    </h4>
                    <p className={`font-editorial-italic mt-2 opacity-90 text-shadow-soft ${big ? "text-xl md:text-2xl" : "text-base"}`}>
                        {dest.tagline}
                    </p>
                </div>
            </div>
        </Link>
    );
}
