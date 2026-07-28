import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Heart, Clock, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StoryDetail() {
    const { id } = useParams();
    const { setDestination } = useTheme();
    const { user } = useAuth();
    const [story, setStory] = useState(null);
    const [liking, setLiking] = useState(false);

    useEffect(() => {
        axios.get(`${API}/stories/${id}`).then((r) => {
            setStory(r.data);
            setDestination(r.data.destination_slug);
        }).catch(() => setStory(null));
        return () => setDestination("base");
    }, [id, setDestination]);

    const like = async () => {
        if (!user) { toast.error("Sign in to like stories"); return; }
        if (liking) return;
        setLiking(true);
        try {
            const r = await axios.post(`${API}/stories/${id}/like`, {}, { withCredentials: true });
            setStory((s) => ({ ...s, likes: (s.likes || 0) + (r.data.liked ? 1 : -1) }));
        } finally { setLiking(false); }
    };

    if (story === null) return <div className="p-20 text-center opacity-60">Loading…</div>;

    const paragraphs = story.content.split(/\n{2,}/).filter(Boolean);

    return (
        <article className="max-w-[820px] mx-auto px-6 md:px-10 py-12">
            <Link to="/stories" className="inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100 mb-8" data-testid="story-back">
                <ArrowLeft className="w-4 h-4" /> All stories
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70 mb-4">
                    <MapPin className="w-3.5 h-3.5" />
                    <Link to={`/destination/${story.destination_slug}`} className="hover:italic">{story.destination_name}</Link>
                    <span>·</span>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{story.read_time_min} min read</span>
                </div>
                <h1 className="font-display text-4xl md:text-6xl tracking-tighter leading-[1.05]" data-testid="story-title">{story.title}</h1>

                <div className="mt-6 flex items-center gap-3">
                    {story.author_picture && <img src={story.author_picture} alt="" className="w-11 h-11 rounded-full" />}
                    <div>
                        <p className="font-display text-lg">{story.author_name}</p>
                        <p className="text-xs opacity-60">{new Date(story.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl mt-8 h-[420px]">
                    <img src={story.cover_image} alt={story.title} className="w-full h-full object-cover" />
                </div>

                <div className="mt-10 space-y-6">
                    {paragraphs.map((p, i) => (
                        <p key={i} className="font-editorial text-xl md:text-2xl leading-relaxed">
                            {i === 0 ? <span className="font-display float-left text-6xl md:text-7xl mr-3 leading-[0.85]" style={{ color: "rgb(var(--by-primary))" }}>{p.charAt(0)}</span> : null}
                            {i === 0 ? p.slice(1) : p}
                        </p>
                    ))}
                </div>

                {story.tags?.length > 0 && (
                    <div className="mt-10 flex flex-wrap gap-2">
                        {story.tags.map((t) => (
                            <span key={t} className="px-3 py-1 rounded-full text-xs uppercase tracking-widest border" style={{ borderColor: "rgb(var(--by-text) / 0.15)" }}>#{t}</span>
                        ))}
                    </div>
                )}

                <div className="mt-12 flex items-center justify-between border-t pt-6" style={{ borderColor: "rgb(var(--by-text) / 0.08)" }}>
                    <button onClick={like} disabled={liking} data-testid="story-like" className="pill-btn ghost">
                        <Heart className="w-4 h-4" /> {story.likes || 0} {story.likes === 1 ? "like" : "likes"}
                    </button>
                    <Link to={`/destination/${story.destination_slug}`} className="pill-btn ghost">
                        Explore {story.destination_name}
                    </Link>
                </div>
            </motion.div>
        </article>
    );
}
