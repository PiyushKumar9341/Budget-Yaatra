import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowRight, Save, Wallet, Calendar, Compass, BookHeart, Printer, Share2, MapPin, Train } from "lucide-react";
import { toast } from "sonner";
import PackingListWidget from "@/components/PackingListWidget";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STYLES = [
    { key: "chill", label: "Chill & Slow", icon: BookHeart },
    { key: "adventure", label: "Adventure", icon: Compass },
    { key: "spiritual", label: "Spiritual", icon: Sparkles },
    { key: "family", label: "Family", icon: Wallet },
    { key: "balanced", label: "Balanced Mix", icon: Calendar },
];

const STARTING_CITIES = [
    { name: "Delhi", icon: "🏙️" },
    { name: "Mumbai", icon: "🌊" },
    { name: "Bengaluru", icon: "🌳" },
    { name: "Kolkata", icon: "🛺" },
];

// Fare estimates by city & destination type
const TRANSPORT_ESTIMATES = {
    "Delhi": { sleeper: 800, ac3: 1800, flight: 4500 },
    "Mumbai": { sleeper: 1200, ac3: 2400, flight: 5800 },
    "Bengaluru": { sleeper: 1400, ac3: 2600, flight: 6200 },
    "Kolkata": { sleeper: 650, ac3: 1500, flight: 3800 },
};

export default function PlannerPage() {
    const { setDestination } = useTheme();
    const { user } = useAuth();
    const [params] = useSearchParams();
    const initialDest = params.get("dest") || "";

    const [dests, setDests] = useState([]);
    const [form, setForm] = useState({ destination_slug: initialDest, origin_city: "Delhi", days: 4, budget: 8000, travel_style: ["balanced"], preferences: "" });
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

    const toggleStyle = (key) => {
        const current = Array.isArray(form.travel_style) ? form.travel_style : [form.travel_style];
        if (current.includes(key)) {
            if (current.length > 1) {
                setForm({ ...form, travel_style: current.filter(k => k !== key) });
            }
        } else {
            if (current.length < 3) {
                setForm({ ...form, travel_style: [...current, key] });
            } else {
                toast.info("You can select up to 3 travel styles");
            }
        }
    };

    const next = () => setStep((s) => Math.min(s + 1, 4));
    const back = () => setStep((s) => Math.max(s - 1, 0));

    const generate = async () => {
        if (!form.destination_slug) { toast.error("Choose a destination first"); return; }
        setLoading(true);
        try {
            const res = await axios.post(`${API}/trip/plan`, form);
            res.data.origin_city = form.origin_city;
            setPlan(res.data);
            setStep(5);
            window.scrollTo({ top: 0, behavior: "smooth" });
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
            <div className="mb-10 print:hidden">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs uppercase tracking-widest" style={{ background: "rgb(var(--by-accent) / 0.6)" }}>
                    <Sparkles className="w-3.5 h-3.5" /> AI Trip Planner
                </div>
                <h1 className="font-display text-5xl md:text-7xl tracking-tighter mt-4" data-testid="planner-heading">
                    Plan your <span className="font-editorial-italic font-normal">trip</span>
                </h1>
                <p className="font-editorial-italic text-xl mt-3 opacity-70">Tell us your preferences. Our AI will craft your custom itinerary.</p>
            </div>

            {step < 5 && (
                <div className="by-card p-8 md:p-10 max-w-3xl">
                    <StepProgress step={step} total={5} />
                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
                            {step === 0 && (
                                <div>
                                    <h2 className="font-display text-3xl tracking-tight mb-4">Where do you want to go?</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                        {dests.map((d) => (
                                            <button key={d.slug} data-testid={`plan-dest-${d.slug}`} onClick={() => setForm({ ...form, destination_slug: d.slug })}
                                                className={`p-4 rounded-2xl text-left border transition-all ${form.destination_slug === d.slug ? "border-2" : "border"}`}
                                                style={{ borderColor: form.destination_slug === d.slug ? "rgb(var(--by-primary))" : "rgb(var(--by-text) / 0.1)", background: form.destination_slug === d.slug ? "rgb(var(--by-primary) / 0.08)" : "transparent" }}>
                                                <p className="font-display text-lg tracking-tight">{d.name}</p>
                                                <p className="text-xs opacity-60 mt-1">{d.state} · ₹{d.budget_per_day}/day</p>
                                            </button>
                                        ))}
                                    </div>

                                    <h3 className="font-display text-lg tracking-tight mb-2 opacity-90">Where are you starting from?</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                         {STARTING_CITIES.map((c) => (
                                            <button 
                                                key={c.name}
                                                onClick={() => setForm({ ...form, origin_city: c.name })}
                                                className="p-3 rounded-xl border text-sm flex items-center gap-2 transition"
                                                style={{
                                                    borderColor: form.origin_city === c.name ? "rgb(var(--by-primary))" : "rgb(var(--by-text) / 0.15)",
                                                    background: form.origin_city === c.name ? "rgb(var(--by-primary) / 0.12)" : "transparent",
                                                    fontWeight: form.origin_city === c.name ? "600" : "400"
                                                }}
                                            >
                                                <span>{c.icon}</span> {c.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {step === 1 && (
                                <div>
                                    <h2 className="font-display text-3xl tracking-tight mb-6">How many days?</h2>
                                    <input type="range" min="1" max="14" value={form.days} onChange={(e) => setForm({ ...form, days: +e.target.value })} className="w-full accent-current" data-testid="plan-days" />
                                    <p className="text-4xl font-display mt-4">{form.days} <span className="font-editorial-italic text-xl opacity-70">{form.days === 1 ? "day" : "days"}</span></p>
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
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-display text-3xl tracking-tight">Select travel styles</h2>
                                        <span className="text-xs px-3 py-1 rounded-full font-semibold border" style={{ background: "rgb(var(--by-primary) / 0.1)", borderColor: "rgb(var(--by-primary) / 0.2)", color: "rgb(var(--by-primary))" }}>
                                            Pick 1 to 3 styles ({Array.isArray(form.travel_style) ? form.travel_style.length : 1}/3)
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {STYLES.map((s) => {
                                            const Icon = s.icon;
                                            const active = Array.isArray(form.travel_style) ? form.travel_style.includes(s.key) : form.travel_style === s.key;
                                            return (
                                                <button key={s.key} data-testid={`plan-style-${s.key}`} onClick={() => toggleStyle(s.key)}
                                                    className="p-5 rounded-2xl text-left border transition-all relative"
                                                    style={{ borderColor: active ? "rgb(var(--by-primary))" : "rgb(var(--by-text) / 0.1)", background: active ? "rgb(var(--by-primary) / 0.12)" : "transparent", borderWidth: active ? 2 : 1 }}>
                                                    {active && <span className="absolute top-3 right-3 text-xs px-1.5 py-0.5 rounded-md font-bold text-white" style={{ background: "rgb(var(--by-primary))" }}>✓</span>}
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
                                    <h2 className="font-display text-3xl tracking-tight mb-6">Any special preferences?</h2>
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
                                {loading ? "Crafting your itinerary..." : <>Generate My Trip <Sparkles className="w-4 h-4" /></>}
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
    const originCity = plan.origin_city || "Delhi";
    const transportInfo = TRANSPORT_ESTIMATES[originCity] || TRANSPORT_ESTIMATES["Delhi"];

    const handlePrintPDF = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        const text = `*Budget Yatra Trip Plan to ${plan.destination?.name}*\n` +
            `*Title:* ${plan.title}\n` +
            `*Estimated Cost:* ₹${plan.total_estimated_cost?.toLocaleString("en-IN")}\n` +
            `*Starting From:* ${originCity}\n\n` +
            `Planned via Budget Yaatra (http://localhost:3000)`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} data-testid="plan-result" className="printable-plan">
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

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 mb-8 print:hidden">
                <button onClick={onSave} className="pill-btn" data-testid="plan-save">
                    <Save className="w-4 h-4" /> Save to My Trips
                </button>
                <button onClick={handlePrintPDF} className="pill-btn ghost border border-stone-700">
                    <Printer className="w-4 h-4 text-emerald-400" /> Export PDF / Print
                </button>
                <button onClick={handleWhatsAppShare} className="pill-btn ghost border border-emerald-800 text-emerald-400">
                    <Share2 className="w-4 h-4" /> Share on WhatsApp
                </button>
                <button onClick={onRestart} className="pill-btn ghost" data-testid="plan-restart">
                    Plan another
                </button>
            </div>

            {/* Transport Estimator Card */}
            <div className="by-card mb-8">
                <div className="flex items-center gap-2 mb-4 font-semibold text-base" style={{ color: "rgb(var(--by-primary))" }}>
                    <Train className="w-5 h-5" />
                    <span className="font-display tracking-tight text-lg">Estimated Transport Fares from {originCity} to {plan.destination?.name}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl border" style={{ borderColor: "rgb(var(--by-text) / 0.1)", background: "rgb(var(--by-text) / 0.03)" }}>
                        <span className="opacity-70 block mb-1 font-editorial text-sm">Train (Sleeper)</span>
                        <span className="font-display font-bold text-xl block">₹{transportInfo.sleeper}</span>
                        <span className="opacity-50 block text-[11px] mt-1">Approx 1-way fare</span>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ borderColor: "rgb(var(--by-text) / 0.1)", background: "rgb(var(--by-text) / 0.03)" }}>
                        <span className="opacity-70 block mb-1 font-editorial text-sm">Train (3AC) / Bus</span>
                        <span className="font-display font-bold text-xl block">₹{transportInfo.ac3}</span>
                        <span className="opacity-50 block text-[11px] mt-1">Comfort budget option</span>
                    </div>
                    <div className="p-4 rounded-xl border" style={{ borderColor: "rgb(var(--by-text) / 0.1)", background: "rgb(var(--by-text) / 0.03)" }}>
                        <span className="opacity-70 block mb-1 font-editorial text-sm">Flight (Economy)</span>
                        <span className="font-display font-bold text-xl block">₹{transportInfo.flight}</span>
                        <span className="opacity-50 block text-[11px] mt-1">Fastest travel</span>
                    </div>
                </div>
            </div>

            {/* Day-by-Day Timeline */}
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

            {/* Packing List Widget */}
            <PackingListWidget destinationName={plan.destination?.name} items={plan.packing_tips || []} />

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

