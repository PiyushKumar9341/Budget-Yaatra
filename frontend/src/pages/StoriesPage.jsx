import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { BookOpen, Clock, Heart, PenLine } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StoriesPage() {
    const { setDestination } = useTheme();
    const { user } = useAuth();
    const [params] = useSearchParams();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [destFilter, setDestFilter] = useState(params.get("dest") || "");
    const [dests, setDests] = useState([]);

    useEffect(() => { setDestination(destFilter || "base"); }, [setDestination, destFilter]);

    useEffect(() => {
        axios.get(`${API}/destinations`).then((r) => setDests(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const url = destFilter ? `${API}/stories?destination_slug=${destFilter}` : `${API}/stories`;
        axios.get(url).then((r) => setStories(r.data)).finally(() => setLoading(false));
    }, [destFilter]);

    return (
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-12">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest" style={{ background: "rgb(var(--by-accent) / 0.6)" }}>
                        <BookOpen className="w-3.5 h-3.5" /> Community Stories
                    </div>
                    <h1 className="font-display text-5xl md:text-7xl tracking-tighter mt-4" data-testid="stories-heading">
                        Yatri <span className="font-editorial-italic font-normal">diaries</span>
                    </h1>
                    <p className="font-editorial-italic text-xl mt-3 opacity-70 max-w-2xl">
                        Long-form stories from real travellers. Not paid. Not staged. Just roots.
                    </p>
                </div>
                {user && (
                    <Link to="/stories/new" data-testid="write-story-btn" className="pill-btn">
                        <PenLine className="w-4 h-4" /> Write your story
                    </Link>
                )}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2 mb-8" data-testid="stories-filter">
                <button onClick={() => setDestFilter("")} className={`px-4 py-2 rounded-full text-sm border transition-all ${!destFilter ? "font-semibold" : "opacity-60"}`}
                    style={{ borderColor: "rgb(var(--by-text) / 0.15)", background: !destFilter ? "rgb(var(--by-primary) / 0.12)" : "transparent" }}>
                    All
                </button>
                {dests.map((d) => (
                    <button key={d.slug} onClick={() => setDestFilter(d.slug)}
                        data-testid={`stories-filter-${d.slug}`}
                        className={`px-4 py-2 rounded-full text-sm border transition-all ${destFilter === d.slug ? "font-semibold" : "opacity-60 hover:opacity-100"}`}
                        style={{ borderColor: "rgb(var(--by-text) / 0.15)", background: destFilter === d.slug ? "rgb(var(--by-primary) / 0.12)" : "transparent" }}>
                        {d.name}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="opacity-60">Loading stories…</p>
            ) : stories.length === 0 ? (
                <div className="by-card text-center py-16">
                    <BookOpen className="w-10 h-10 mx-auto opacity-40" />
                    <p className="font-editorial-italic text-xl mt-4 opacity-70">
                        No stories yet {destFilter ? `for this destination` : ""}. Be the first yatri to write one.
                    </p>
                    {user && (
                        <Link to="/stories/new" className="pill-btn mt-6 inline-flex">
                            <PenLine className="w-4 h-4" /> Write the first story
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="stories-grid">
                    {stories.map((s, i) => (
                        <StoryCard key={s.story_id} story={s} idx={i} />
                    ))}
                </div>
            )}
        </div>
    );
}

function StoryCard({ story, idx }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Link to={`/stories/${story.story_id}`} data-testid={`story-card-${story.story_id}`} className="block group">
                <div className="relative overflow-hidden rounded-3xl h-56 mb-4">
                    <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.55))" }} />
                    <div className="absolute bottom-4 left-4 right-4 text-white flex items-center justify-between text-xs uppercase tracking-widest">
                        <span>{story.destination_name}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {story.read_time_min} min</span>
                    </div>
                </div>
                <h3 className="font-display text-2xl tracking-tight leading-tight group-hover:italic transition-all">{story.title}</h3>
                <p className="font-editorial mt-2 opacity-80 leading-relaxed line-clamp-3">{story.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-sm opacity-70">
                    <div className="flex items-center gap-2">
                        {story.author_picture && <img src={story.author_picture} alt="" className="w-6 h-6 rounded-full" />}
                        <span>{story.author_name}</span>
                    </div>
                    <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {story.likes || 0}</span>
                </div>
            </Link>
        </motion.div>
    );
}
