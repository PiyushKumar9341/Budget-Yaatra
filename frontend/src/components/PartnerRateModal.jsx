import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PartnerRateModal({ open, onClose, destinationSlug, partnerType, partnerName, onSaved }) {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        setSubmitting(true);
        try {
            await axios.post(`${API}/partners/rate`, {
                destination_slug: destinationSlug,
                partner_type: partnerType,
                partner_name: partnerName,
                rating, comment,
            }, { withCredentials: true });
            toast.success("Shukriya! Rating saved.");
            onSaved?.();
            onClose();
        } catch (e) {
            toast.error("Could not save rating");
        } finally { setSubmitting(false); }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ type: "spring", damping: 25, stiffness: 260 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="pointer-events-auto w-full max-w-md rounded-3xl p-8" style={{ background: "rgb(var(--by-bg))", border: "1px solid rgb(var(--by-text) / 0.08)" }} data-testid="rate-modal">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-xs uppercase tracking-widest opacity-70">{partnerType === "rental" ? "Rate rental" : "Rate guide"}</p>
                                    <h3 className="font-display text-2xl tracking-tight mt-1">{partnerName}</h3>
                                </div>
                                <button onClick={onClose} className="p-1 hover:opacity-70"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="mt-6 flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} onClick={() => setRating(n)} data-testid={`partner-star-${n}`}>
                                        <Star className={`w-8 h-8 ${n <= rating ? "fill-current" : "opacity-30"}`} style={{ color: "rgb(var(--by-primary))" }} />
                                    </button>
                                ))}
                                <span className="ml-3 text-sm opacity-70">{rating}/5</span>
                            </div>

                            <textarea
                                data-testid="partner-comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Optional: how was your experience?"
                                rows={4}
                                className="by-input mt-6 resize-none font-editorial"
                            />

                            <div className="mt-6 flex justify-end gap-3">
                                <button onClick={onClose} className="pill-btn ghost">Cancel</button>
                                <button onClick={submit} disabled={submitting} className="pill-btn disabled:opacity-50" data-testid="partner-rate-submit">
                                    {submitting ? "Saving..." : "Submit rating"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
