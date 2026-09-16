import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mountain, Instagram, Twitter, Youtube, Linkedin, Mail, ArrowUpRight, Send, X } from "lucide-react";
import { toast } from "sonner";

// SOCIAL LINKS — replace `#` with your real URLs when ready
const SOCIALS = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Twitter, label: "Twitter / X", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
];

const MODAL_CONTENT = {
    privacy: {
        title: "Privacy Policy",
        subtitle: "Budget Yaatra Roots Protection",
        content: (
            <div className="space-y-4 text-white/75 font-editorial text-base leading-relaxed">
                <p className="font-semibold text-white">Namaste Yatri,</p>
                <p>At Budget Yaatra, your privacy is sacred. We built this platform with the philosophy of true human connection, without invasive tracking or data harvesting.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">1. Information We Collect</h4>
                <p>We only collect the information you explicitly provide (such as saved yatras or newsletter email subscription). We never sell, share, or monetize your personal data.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">2. Zero Commission & Zero Ads</h4>
                <p>Our recommendations are 100% independent. We do not use commercial trackers, retargeting ad pixels, or third-party cookies.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">3. Local Control</h4>
                <p>Your yatra plans and preferences stay securely stored in your browser storage for maximum control and privacy.</p>
            </div>
        )
    },
    terms: {
        title: "Terms of Service",
        subtitle: "The Yatri Code of Honor",
        content: (
            <div className="space-y-4 text-white/75 font-editorial text-base leading-relaxed">
                <p className="font-semibold text-white">Welcome to the Budget Yaatra Community.</p>
                <p>By exploring and using Budget Yaatra, you agree to uphold our core values of authentic, respectful travel across Bharat.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">1. Respect Local Communities</h4>
                <p>Always honor local traditions, culture, and nature. Travel with empathy, leave no trace, and support local homestays and artisans.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">2. Honest Storytelling</h4>
                <p>Stories and recommendations shared on Budget Yaatra must be genuine, human experiences—never sponsored or commissioned.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">3. Fair Use</h4>
                <p>All itineraries and curated content are for personal travel exploration. Commercial scraping or unauthorized re-publication is prohibited.</p>
            </div>
        )
    },
    roots: {
        title: "Roots Pledge",
        subtitle: "॥ शुभ ॥ — Travel That Stays Rooted",
        content: (
            <div className="space-y-4 text-white/75 font-editorial text-base leading-relaxed">
                <p className="font-semibold text-white text-lg font-editorial-italic">"Safar wahi jo mitti se jode."</p>
                <p>The Roots Pledge is our sacred promise to keep travel in India authentic, affordable, and deeply connected to local lives.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">1. Never Commissioned</h4>
                <p>No hotel, guide, or cafe can pay to be featured on Budget Yaatra. Every spot is hand-picked purely for its soul and authentic value.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">2. Empowering Local Bharat</h4>
                <p>We champion budget homestays, local dhabas, village artisans, and eco-conscious travelers who enrich local economies.</p>
                <h4 className="font-editorial text-base text-[#D66D4B] font-semibold mt-4 mb-1">3. Human First</h4>
                <p>Built with real conversations, chai on foggy mornings, and a passion for uncovering Bharat's hidden gems.</p>
            </div>
        )
    }
};

export default function Footer() {
    const [email, setEmail] = useState("");
    const [isHovered, setIsHovered] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    
    const textRef = useRef(null);
    const targetPos = useRef({ x: 0, y: 0 });
    const currentPos = useRef({ x: 0, y: 0 });
    const animRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!textRef.current) return;
        const rect = textRef.current.getBoundingClientRect();
        targetPos.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const handleMouseEnter = (e) => {
        if (textRef.current) {
            const rect = textRef.current.getBoundingClientRect();
            const initial = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            targetPos.current = initial;
            currentPos.current = initial;
        }
        setIsHovered(true);
    };

    // Smooth Lerp Animation Loop for Sheryians-style fluid inertia cursor follow with noticeable smooth lag delay
    useEffect(() => {
        const updateSpotlight = () => {
            currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.045;
            currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.045;

            if (textRef.current) {
                textRef.current.style.setProperty("--spotlight-x", `${currentPos.current.x}px`);
                textRef.current.style.setProperty("--spotlight-y", `${currentPos.current.y}px`);
            }
            animRef.current = requestAnimationFrame(updateSpotlight);
        };
        animRef.current = requestAnimationFrame(updateSpotlight);
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    const subscribe = (e) => {
        e.preventDefault();
        if (!email || !email.includes("@")) { toast.error("Enter a valid email"); return; }
        toast.success("Namaste! You're on the list ✨");
        setEmail("");
    };

    const year = new Date().getFullYear();

    return (
        <footer className="mt-16 relative bg-black text-white pt-10 md:pt-14 pb-4 md:pb-6 px-6 md:px-12 flex flex-col justify-between overflow-hidden select-none" data-testid="site-footer">
            {/* Background Ambient Glow — Soft Warm Terracotta Aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#D66D4B]/10 blur-[150px] pointer-events-none rounded-full" />

                {/* Top Brand Hero Section with Hindi "॥ शुभ ॥" and Giant Statement YAATRA */}
                <div className="w-full flex-1 flex flex-col justify-center items-center relative z-10 mb-8 md:mb-12">
                    {/* Hindi Script Badge Above "YAATRA" — Soft Warm Terracotta Glow */}
                    <div className="flex items-center gap-2 mb-3">
                        <span 
                            className="text-2xl md:text-3xl font-editorial font-bold tracking-[0.2em] text-[#D66D4B]"
                            style={{
                                textShadow: "0 0 16px rgba(214, 109, 75, 0.35)"
                            }}
                        >
                            ॥ शुभ ॥
                        </span>
                    </div>

                    {/* Stretched Statement Text ("YAATRA") — Natural Distortion-Free Aspect Ratio */}
                    <div
                        ref={textRef}
                        onMouseMove={handleMouseMove}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={() => setIsHovered(false)}
                        className="relative w-full cursor-default select-none overflow-hidden flex justify-center items-center py-2"
                    >
                        {/* Base Hollow Outline Layer */}
                        <p
                            className="w-full font-display text-[17vw] md:text-[19vw] lg:text-[20.5vw] leading-none uppercase whitespace-nowrap text-center select-none"
                            style={{
                                color: "transparent",
                                WebkitTextStroke: "1px rgba(255, 255, 255, 0.22)",
                                letterSpacing: "0.04em",
                            }}
                        >
                            Yaatra
                        </p>

                        {/* Interactive Ultra Soft Warm Terracotta Lerp Spotlight Layer */}
                        <p
                            className={`absolute inset-0 w-full font-display text-[17vw] md:text-[19vw] lg:text-[20.5vw] leading-none uppercase whitespace-nowrap text-center select-none pointer-events-none transition-opacity duration-700 ease-out py-2 ${
                                isHovered ? "opacity-100" : "opacity-0"
                            }`}
                            style={{
                                color: "#D66D4B",
                                WebkitTextStroke: "1px #D66D4B",
                                letterSpacing: "0.04em",
                                maskImage: `radial-gradient(ellipse 270px 100% at var(--spotlight-x, 50%) var(--spotlight-y, 50%), black 0%, rgba(0, 0, 0, 0.25) 60%, transparent 100%)`,
                                WebkitMaskImage: `radial-gradient(ellipse 270px 100% at var(--spotlight-x, 50%) var(--spotlight-y, 50%), black 0%, rgba(0, 0, 0, 0.25) 60%, transparent 100%)`,
                            }}
                        >
                            Yaatra
                        </p>
                    </div>
                </div>

                {/* Overlaid Footer Content Grid at the Bottom */}
                <div className="w-full relative z-20 border-t border-white/10 pt-8 md:pt-10">
                    <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10">
                        {/* Brand + newsletter — spans 5 */}
                        <div className="md:col-span-5">
                            <Link to="/" className="inline-flex items-center gap-2.5 group text-white" data-testid="footer-logo">
                                <Mountain className="w-5 h-5 text-[#D66D4B] transition-colors duration-300" />
                                <span className="font-display text-2xl tracking-tighter text-white">Budget Yaatra</span>
                            </Link>
                            <p className="font-editorial-italic text-base md:text-lg mt-2 leading-snug max-w-md text-white/85">
                                Yatras that stay <span className="not-italic font-editorial font-semibold text-white">rooted</span>. Never commissioned. Always human.
                            </p>

                            <form onSubmit={subscribe} className="mt-4 max-w-md" data-testid="newsletter-form">
                                <label className="text-[11px] uppercase tracking-widest text-white/60 flex items-center gap-1.5 mb-1.5 font-sans">
                                    <Mail className="w-3.5 h-3.5" /> Get one hand-picked story every Sunday
                                </label>
                                <div className="flex items-center gap-2 border-b border-white/30 pb-1">
                                    <input
                                        data-testid="newsletter-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="flex-1 bg-transparent outline-none py-1 font-editorial text-base text-white placeholder:text-white/40"
                                    />
                                    <button
                                        type="submit"
                                        data-testid="newsletter-submit"
                                        className="p-1.5 rounded-full bg-[#D66D4B] text-white transition-all duration-300 hover:bg-[#c45c3b] shadow-md"
                                        aria-label="Subscribe"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-sm md:text-base text-white/75 mt-2.5 font-editorial-italic tracking-wide font-medium">🔒 No spam. No sponsored posts. Ever.</p>
                            </form>
                        </div>

                        {/* Explore */}
                        <div className="md:col-span-2">
                            <p className="text-[11px] uppercase tracking-widest text-white/60 mb-3 font-sans">Explore</p>
                            <ul className="space-y-2 font-editorial text-base text-white/85">
                                <li><FooterLink to="/">Destinations</FooterLink></li>
                                <li><FooterLink to="/planner">Plan a Yatra</FooterLink></li>
                                <li><FooterLink to="/stories">Stories</FooterLink></li>
                                <li><FooterLink to="/mine">My Yatras</FooterLink></li>
                            </ul>
                        </div>

                        {/* Community */}
                        <div className="md:col-span-2">
                            <p className="text-[11px] uppercase tracking-widest text-white/60 mb-3 font-sans">Community</p>
                            <ul className="space-y-2 font-editorial text-base text-white/85">
                                <li><FooterLink to="/">Yatri Diaries</FooterLink></li>
                                <li><FooterLink to="/stories">Write a Story</FooterLink></li>
                                <li><FooterExternal href="#">Local Partners</FooterExternal></li>
                                <li>
                                    <button onClick={() => setActiveModal("roots")} className="hover:text-[#D66D4B] transition-colors text-white/80 outline-none text-left">
                                        Trust & Roots
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Follow / Socials */}
                        <div className="md:col-span-3">
                            <p className="text-[11px] uppercase tracking-widest text-white/60 mb-3 font-sans">Follow along</p>
                            <div className="flex flex-wrap gap-2.5">
                                {SOCIALS.map((s) => (
                                    <a
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={s.label}
                                        data-testid={`social-${s.label.toLowerCase().replace(/[^a-z]/g, "")}`}
                                        className="w-9 h-9 rounded-full border border-white/20 text-white flex items-center justify-center transition-colors duration-300 hover:bg-[#D66D4B] hover:border-[#D66D4B] shadow-sm"
                                    >
                                        <s.icon className="w-4 h-4" />
                                    </a>
                                ))}
                            </div>

                            <p className="text-[11px] uppercase tracking-widest text-white/60 mt-4 mb-1.5 font-sans">Say Namaste</p>
                            <a href="mailto:hello@budgetyaatra.in" className="font-editorial text-base text-white hover:text-[#D66D4B] hover:italic transition-all inline-flex items-center gap-1">
                                hello@budgetyaatra.in <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="border-t border-white/10 mt-6 pt-3">
                        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-white/60">
                            <p className="font-editorial-italic text-sm text-white/70">
                                Crafted for Yatri spirits · Bharat, {year}
                            </p>
                            <div className="flex flex-wrap gap-4 font-sans text-[11px]">
                                <button onClick={() => setActiveModal("privacy")} className="hover:text-white hover:underline outline-none">Privacy</button>
                                <button onClick={() => setActiveModal("terms")} className="hover:text-white hover:underline outline-none">Terms</button>
                                <button onClick={() => setActiveModal("roots")} className="hover:text-white hover:underline outline-none">Roots pledge</button>
                                <span className="hidden md:inline">·</span>
                                <span>© {year} Budget Yaatra</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Glassmorphism Information Modal */}
                {activeModal && MODAL_CONTENT[activeModal] && (
                    <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
                        onClick={() => setActiveModal(null)}
                    >
                        <div 
                            className="bg-zinc-950 border border-white/15 rounded-2xl p-6 md:p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative text-white [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                                <div>
                                    <span className="text-xs uppercase tracking-widest text-[#D66D4B] font-sans block mb-1">
                                        {MODAL_CONTENT[activeModal].subtitle}
                                    </span>
                                    <h3 className="text-2xl font-display text-white">
                                        {MODAL_CONTENT[activeModal].title}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setActiveModal(null)} 
                                    className="w-8 h-8 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white flex items-center justify-center transition-all outline-none"
                                    aria-label="Close modal"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            {MODAL_CONTENT[activeModal].content}

                            {/* Footer button */}
                            <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
                                <button
                                    onClick={() => setActiveModal(null)}
                                    className="px-5 py-2 rounded-full bg-[#D66D4B] hover:bg-[#c45c3b] text-white text-sm font-sans font-medium transition-all shadow-md"
                                >
                                    Understood ✨
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </footer>
    );
}

function FooterLink({ to, children }) {
    return (
        <Link to={to} className="group inline-flex items-center gap-1 transition-opacity duration-300 hover:text-[#D66D4B] text-white/80">
            <span className="group-hover:italic transition-all">{children}</span>
            <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </Link>
    );
}

function FooterExternal({ href, children }) {
    return (
        <a href={href} className="group inline-flex items-center gap-1 transition-opacity duration-300 hover:text-[#D66D4B] text-white/80">
            <span className="group-hover:italic transition-all">{children}</span>
            <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </a>
    );
}
