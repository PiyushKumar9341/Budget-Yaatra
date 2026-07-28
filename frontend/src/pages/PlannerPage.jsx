import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowRight, Save, Wallet, Calendar, Compass, BookHeart } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES = [
    { key: "chill", label: "Chill & Slow", icon: BookHeart },
    { key: "adventure", label: "Adventure", icon: Compass },
    { key: "spiritual", label: "Spiritual", icon: Sparkles },
    { key: "family", label: "Family", icon: Wallet },
    { key: "balanced", label: "Balanced Mix", icon: Calendar },
];

export default function PlannerPage() {
    const { setDestination } = useTheme();
    const { user } = useAuth();
    const [params] = useSearchParams();
    const initialDest = params.get("dest") || "";

    const [dests, setDests] = useState([]);
    const [form, setForm] = useState({ destination_slug: initialDest, days: 4, budget: 8000, travel_style: "balanced", preferences: "" });
    const [step, setStep] = useState(0);
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setDestination(initialDest || "base");
        axios.get(`${API}/destinations`).then((r) => setDests(r.data)).catch(() => {});
    }, [setDestination, initialDest]);

    useEffect(() => {
        if (form.destination_slug) setDestination(form.destination_slug);
    }, [form.destination_slug, setDestination]);

    const next = () => setStep((s) => Math.min(s + 1, 4));
    const back = () => setStep((s) => Math.max(s - 1, 0));

    const generate = async () => {
        if (!form.destination_slug) { toast.error("Choose a destination first"); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${API}/trip/plan`, form);
            setPlan(res.data);
            setStep(5);
        } catch (e) {
            toast.error("AI planner failed — try smaller days or different budget");
        } finally { setLoading(false); }
    };

    const savePlan = async () => {
        if (!user) { toast.error("Sign in to save this trip"); return; }
        try {
            await axios.post(`${API}/trip/save`, { plan }, { withCredentials: true });
            toast.success("Trip saved to My Trips");
        } catch { toast.error("Could not save"); }
    };

    return (
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-12">
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest" style={{ background: "rgb(var(--by-accent) / 0.6)" }}>
                    <Sparkles className="w-3.5 h-3.5" /> AI Trip Planner
                </div>
                <h1 className="font-display text-5xl md:text-7xl tracking-tighter mt-4" data-testid="planner-heading">
                    Plan your <span className="font-editorial-italic font-normal">yatra</span>
                </h1>
                <p className="font-editorial-italic text-xl mt-3 opacity-70">Bataao thoda sa. Yatri banayega puri story.</p>
            </div>

            {step < 5 && (
                <div className="by-card p-8 md:p-10 max-w-3xl">
                    <StepProgress step={step} total={5} />
                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
                            {step === 0 && (
                                <div>
                                    <h2 className="font-display text-3xl tracking-tight mb-6">Kaha jaana hai?</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {dests.map((d) => (
                                            <button key={d.slug} data-testid={`plan-dest-${d.slug}`} onClick={() => setForm({ ...form, destination_slug: d.slug })}
                                                className={`p-4 rounded-2xl text-left border transition-all ${form.destination_slug === d.slug ? "border-2" : "border"}`}
                                                style={{ borderColor: form.destination_slug === d.slug ? "rgb(var(--by-primary))" : "rgb(var(--by-text) / 0.1)", background: form.destination_slug === d.slug ? "rgb(var(--by-primary) / 0.08)" : "transparent" }}>
                                                <p className="font-display text-lg tracking-tight">{d.name}</p>
                                                <p className="text-xs opacity-60 mt-1">{d.state} · ₹{d.budget_per_day}/day</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {step === 1 && (
                                <div>
                                    <h2 className="font-display text-3xl tracking-tight mb-6">Kitne din?</h2>
                                    <input type="range" min="1" max="14" value={form.days} onChange={(e) => setForm({ ...form, days: +e.target.value })} className="w-full accent-current" data-testid="plan-days" />
                                    <p className="text-4xl font-display mt-4">{form.days} <span className="font-editorial-italic text-xl opacity-70">{form.days === 1 ? "din" : "din"}</span></p>
                                </div>
                            )}
                            {step === 2 && (
                                <div>
                                    <h2 className="font-display text-3xl tracking-tight mb-6">Total budget?</h2>
                                    <input type="range" min="1500" max="50000" step="500" value={form.budget} onChange={(e) => setForm({ ...form, budget: +e.target.value })} className="w-full" data-testid="plan-budget" />
                                    <p className="text-4xl font-display mt-4">₹{form.budget.toLocaleString("en-IN")}</p>
                                    <p className="text-sm opacity-60 mt-1 font-editorial-italic">Approx ₹{Math.round(form.budget / form.days).toLocaleString("en-IN")}/day</p>
                                </div>
                            )}
                            {step === 3 && (
                                <div>
                                    <h2 className="font-display text-3xl tracking-tight mb-6">Vibe kya hai?</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {STYLES.map((s) => {
                                            const Icon = s.icon;
                                            const active = form.travel_style === s.key;
                                            return (
                                                <button key={s.key} data-testid={`plan-style-${s.key}`} onClick={() => setForm({ ...form, travel_style: s.key })}
                                                    className="p-5 rounded-2xl text-left border transition-all"
                                                    style={{ borderColor: active ? "rgb(var(--by-primary))" : "rgb(var(--by-text) / 0.1)", background: active ? "rgb(var(--by-primary) / 0.08)" : "transparent", borderWidth: active ? 2 : 1 }}>
                                                    <Icon className="w-5 h-5 mb-2" />
                                                    <p className="font-display text-lg tracking-tight">{s.label}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {step === 4 && (
                                <div>
                                    <h2 className="font-display text-3xl tracking-tight mb-6">Koi special preference?</h2>
                                    <textarea value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })}
                                        placeholder="e.g. Vegetarian only, love photography, solo female traveller, no early mornings..."
                                        rows={4} className="by-input resize-none" data-testid="plan-prefs" />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    <div className="mt-10 flex items-center justify-between">
                        <button onClick={back} disabled={step === 0} className="pill-btn ghost disabled:opacity-30" data-testid="plan-back">Back</button>
                        {step < 4 ? (
                            <button onClick={next} className="pill-btn" data-testid="plan-next">Next <ArrowRight className="w-4 h-4" /></button>
                        ) : (
                            <button onClick={generate} disabled={loading} className="pill-btn disabled:opacity-50" data-testid="plan-generate">
                                {loading ? "Yatri soch raha hai..." : <>Generate my Yatra <Sparkles className="w-4 h-4" /></>}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {step === 5 && plan && (
                <PlanResult plan={plan} onSave={savePlan} onRestart={() => { setPlan(null); setStep(0); }} />
            )}
        </div>
    );
}

function StepProgress({ step, total }) {
    return (
        <div className="flex gap-2 mb-8">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: i <= step ? "rgb(var(--by-primary))" : "rgb(var(--by-text) / 0.12)" }} />
            ))}
        </div>
    );
}

function PlanResult({ plan, onSave, onRestart }) {
    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} data-testid="plan-result">
            <div className="relative rounded-3xl overflow-hidden mb-8">
                <img src={plan.destination.hero_image} alt="" className="w-full h-64 object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.75))" }} />
                <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                    <p className="font-editorial-italic opacity-90 text-shadow-soft">{plan.destination.name}</p>
                    <h2 className="font-display text-4xl md:text-6xl tracking-tighter text-shadow-soft">{plan.title}</h2>
                    <p className="font-editorial mt-2 text-lg text-shadow-soft max-w-2xl">{plan.summary}</p>
                    <p className="mt-4 text-sm">Total estimated: <b className="font-display text-2xl">₹{plan.total_estimated_cost?.toLocaleString("en-IN")}</b></p>
                </div>
            </div>

            <div className="flex gap-3 mb-8">
                <button onClick={onSave} className="pill-btn" data-testid="plan-save"><Save className="w-4 h-4" /> Save to My Trips</button>
                <button onClick={onRestart} className="pill-btn ghost" data-testid="plan-restart">Plan another</button>
            </div>

            <div className="relative pl-8 md:pl-12 border-l-2" style={{ borderColor: "rgb(var(--by-primary) / 0.4)" }}>
                {plan.days?.map((d, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="mb-10 relative">
                        <div className="absolute -left-[52px] md:-left-[60px] top-2 w-8 h-8 rounded-full flex items-center justify-center font-display" style={{ background: "rgb(var(--by-primary))", color: "rgb(var(--by-bg))" }}>
                            {d.day}
                        </div>
                        <p className="font-editorial-italic opacity-70">Day {d.day}</p>
                        <h3 className="font-display text-3xl tracking-tighter">{d.theme}</h3>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="by-card"><p className="text-xs uppercase tracking-widest opacity-60">Morning</p><p className="mt-1 font-editorial">{d.morning}</p></div>
                            <div className="by-card"><p className="text-xs uppercase tracking-widest opacity-60">Afternoon</p><p className="mt-1 font-editorial">{d.afternoon}</p></div>
                            <div className="by-card"><p className="text-xs uppercase tracking-widest opacity-60">Evening</p><p className="mt-1 font-editorial">{d.evening}</p></div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm opacity-80">
                            <span>🏠 {d.stay}</span>
                            <span>🍽️ {d.food_tip}</span>
                            <span>💰 ₹{d.day_cost?.toLocaleString("en-IN")}</span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {plan.packing_tips?.length > 0 && (
                <div className="by-card mt-8">
                    <h4 className="font-display text-2xl tracking-tight mb-3">Packing tips</h4>
                    <ul className="list-disc pl-5 space-y-1 font-editorial text-lg">
                        {plan.packing_tips.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                </div>
            )}
            {plan.local_etiquette?.length > 0 && (
                <div className="by-card mt-5">
                    <h4 className="font-display text-2xl tracking-tight mb-3">Local etiquette</h4>
                    <ul className="list-disc pl-5 space-y-1 font-editorial text-lg">
                        {plan.local_etiquette.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                </div>
            )}
        </motion.div>
    );
}
