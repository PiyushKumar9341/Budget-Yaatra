import React, { useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ReviewForm({ slug, onCreated }) {
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [month, setMonth] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (!text.trim() || text.trim().length < 20) { toast.error("Genuine reviews only — likho at least 20 characters"); return; }
        setSubmitting(true);
        try {
            const res = await axios.post(`${API}/reviews`, { destination_slug: slug, rating, text: text.trim(), visited_month: month }, { withCredentials: true });
            toast.success("Shukriya! Aapki story live hai.");
            onCreated({ ...res.data, destination_slug: slug, rating, text, visited_month: month, user_name: "You", created_at: new Date().toISOString() });
            setText(""); setMonth("");
        } catch (e) {
            toast.error("Could not post review");
        } finally { setSubmitting(false); }
    };

    return (
        <div className="by-card" data-testid="review-form">
            <h3 className="font-display text-2xl tracking-tight mb-4">Share your yatra</h3>
            <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} data-testid={`review-star-${n}`}>
                        <Star className={`w-6 h-6 ${n <= rating ? "fill-current" : "opacity-30"}`} style={{ color: "rgb(var(--by-primary))" }} />
                    </button>
                ))}
                <span className="ml-2 text-sm opacity-70">{rating}/5</span>
            </div>
            <input
                data-testid="review-month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="When did you visit? (e.g. October 2025)"
                className="by-input mb-4"
            />
            <textarea
                data-testid="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell us about your real yatra — hidden gems, chai stops, honest tips..."
                rows={4}
                className="by-input resize-none"
            />
            <div className="mt-4 flex justify-end">
                <button data-testid="review-submit" onClick={submit} disabled={submitting} className="pill-btn disabled:opacity-50">
                    {submitting ? "Posting..." : "Post my story"}
                </button>
            </div>
        </div>
    );
}
