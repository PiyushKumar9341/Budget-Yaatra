import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "sonner";
import { PenLine, Image as ImageIcon } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function StoryEditor() {
    const { user, loading } = useAuth();
    const { setDestination } = useTheme();
    const nav = useNavigate();
    const [params] = useSearchParams();
    const [dests, setDests] = useState([]);
    const [form, setForm] = useState({
        destination_slug: params.get("dest") || "",
        title: "",
        cover_image: "",
        content: "",
        tags: "",
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { setDestination(form.destination_slug || "base"); }, [setDestination, form.destination_slug]);

    useEffect(() => {
        axios.get(`${API}/destinations`).then((r) => setDests(r.data));
    }, []);

    if (loading) return <div className="p-20 text-center opacity-60">Loading…</div>;
    if (!user) return (
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
            <h1 className="font-display text-4xl tracking-tighter">Sign in to write</h1>
            <p className="font-editorial-italic text-lg mt-3 opacity-70">Only genuine yatris can share stories.</p>
        </div>
    );

    const submit = async () => {
        if (!form.destination_slug) { toast.error("Choose a destination"); return; }
        if (form.title.trim().length < 6) { toast.error("Title needs to be at least 6 characters"); return; }
        if (form.content.trim().length < 150) { toast.error("Story needs 150+ characters to be genuine"); return; }
        setSubmitting(true);
        try {
            const payload = {
                destination_slug: form.destination_slug,
                title: form.title.trim(),
                cover_image: form.cover_image.trim() || undefined,
                content: form.content.trim(),
                tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
            };
            const r = await axios.post(`${API}/stories`, payload, { withCredentials: true });
            toast.success("Story published!");
            nav(`/stories/${r.data.story_id}`);
        } catch (e) {
            toast.error(e.response?.data?.detail || "Could not publish");
        } finally { setSubmitting(false); }
    };

    return (
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-12">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-70">
                <PenLine className="w-3.5 h-3.5" /> New Story
            </div>
            <h1 className="font-display text-5xl md:text-6xl tracking-tighter mt-2" data-testid="editor-heading">Share your yatra</h1>
            <p className="font-editorial-italic text-xl mt-2 opacity-70">Ekdum roots wali kahani. No filters, no sponsorships.</p>

            <div className="by-card mt-10 p-6 md:p-8 space-y-6">
                <div>
                    <label className="text-xs uppercase tracking-widest opacity-70">Destination</label>
                    <select
                        data-testid="editor-dest"
                        value={form.destination_slug}
                        onChange={(e) => setForm({ ...form, destination_slug: e.target.value })}
                        className="by-input mt-1 text-lg"
                    >
                        <option value="">— Choose —</option>
                        {dests.map((d) => <option key={d.slug} value={d.slug}>{d.name}, {d.state}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs uppercase tracking-widest opacity-70">Title</label>
                    <input
                        data-testid="editor-title"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. 3 din Meghalaya me — bina plan, sirf feel"
                        className="by-input mt-1 text-2xl font-display tracking-tight"
                    />
                </div>
                <div>
                    <label className="text-xs uppercase tracking-widest opacity-70 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Cover image URL (optional)</label>
                    <input
                        data-testid="editor-cover"
                        value={form.cover_image}
                        onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                        placeholder="https://... (we'll use destination hero if blank)"
                        className="by-input mt-1"
                    />
                </div>
                <div>
                    <label className="text-xs uppercase tracking-widest opacity-70">Your story</label>
                    <textarea
                        data-testid="editor-content"
                        value={form.content}
                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                        placeholder="Likho apni yatra ki full kahani... 150+ characters chahiye. Double newline = new paragraph."
                        rows={16}
                        className="by-input mt-1 resize-none font-editorial text-lg"
                    />
                    <p className="text-xs opacity-60 mt-1">{form.content.length} chars · min 150</p>
                </div>
                <div>
                    <label className="text-xs uppercase tracking-widest opacity-70">Tags (comma separated)</label>
                    <input
                        data-testid="editor-tags"
                        value={form.tags}
                        onChange={(e) => setForm({ ...form, tags: e.target.value })}
                        placeholder="solo, monsoon, homestay, food"
                        className="by-input mt-1"
                    />
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={submit} disabled={submitting} data-testid="editor-submit" className="pill-btn disabled:opacity-50">
                        {submitting ? "Publishing..." : "Publish story"}
                    </button>
                </div>
            </div>
        </div>
    );
}
