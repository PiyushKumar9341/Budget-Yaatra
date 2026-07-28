import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mountain, Instagram, Twitter, Youtube, Linkedin, Mail, ArrowUpRight, Send } from "lucide-react";
import { toast } from "sonner";

// SOCIAL LINKS — replace `#` with your real URLs when ready
const SOCIALS = [
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Twitter, label: "Twitter / X", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
    { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export default function Footer() {
    const [email, setEmail] = useState("");

    const subscribe = (e) => {
        e.preventDefault();
        if (!email || !email.includes("@")) { toast.error("Enter a valid email"); return; }
        // TODO: hook to /api/newsletter endpoint later
        toast.success("Namaste! You're on the list ✨");
        setEmail("");
    };

    const year = new Date().getFullYear();

    return (
        <footer className="mt-24 relative overflow-hidden" data-testid="site-footer">
            {/* Big marquee-ish brand watermark */}
            <div className="pointer-events-none absolute -bottom-16 left-0 right-0 opacity-[0.04] select-none">
                <p className="font-display text-[22vw] leading-none tracking-tighter whitespace-nowrap text-center">
                    Yaatra
                </p>
            </div>

            <div className="relative border-t" style={{ borderColor: "rgb(var(--by-text) / 0.1)" }}>
                <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-16 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Brand + newsletter — spans 5 */}
                    <div className="md:col-span-5">
                        <Link to="/" className="inline-flex items-center gap-2 group" data-testid="footer-logo">
                            <Mountain className="w-6 h-6 transition-transform duration-500 group-hover:-translate-y-1" style={{ color: "rgb(var(--by-primary))" }} />
                            <span className="font-display text-3xl tracking-tighter">Budget Yaatra</span>
                        </Link>
                        <p className="font-editorial-italic text-2xl mt-4 leading-snug max-w-md">
                            Yatras that stay <span className="not-italic font-editorial font-semibold">rooted</span>. Never commissioned. Always human.
                        </p>

                        <form onSubmit={subscribe} className="mt-8 max-w-md" data-testid="newsletter-form">
                            <label className="text-xs uppercase tracking-widest opacity-70 flex items-center gap-1 mb-2">
                                <Mail className="w-3 h-3" /> Get one hand-picked story every Sunday
                            </label>
                            <div className="flex items-center gap-2 border-b pb-1" style={{ borderColor: "rgb(var(--by-text) / 0.3)" }}>
                                <input
                                    data-testid="newsletter-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="flex-1 bg-transparent outline-none py-2 font-editorial text-lg placeholder:opacity-40"
                                />
                                <button
                                    type="submit"
                                    data-testid="newsletter-submit"
                                    className="p-2 rounded-full transition-all duration-300 hover:-translate-y-0.5"
                                    style={{ background: "rgb(var(--by-primary))", color: "rgb(var(--by-bg))" }}
                                    aria-label="Subscribe"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs opacity-60 mt-2 font-editorial-italic">No spam. No sponsored posts. Ever.</p>
                        </form>
                    </div>

                    {/* Explore */}
                    <div className="md:col-span-2">
                        <p className="text-xs uppercase tracking-widest opacity-70 mb-4">Explore</p>
                        <ul className="space-y-3 font-editorial text-lg">
                            <li><FooterLink to="/">Destinations</FooterLink></li>
                            <li><FooterLink to="/planner">Plan a Yatra</FooterLink></li>
                            <li><FooterLink to="/stories">Stories</FooterLink></li>
                            <li><FooterLink to="/mine">My Yatras</FooterLink></li>
                        </ul>
                    </div>

                    {/* Community */}
                    <div className="md:col-span-2">
                        <p className="text-xs uppercase tracking-widest opacity-70 mb-4">Community</p>
                        <ul className="space-y-3 font-editorial text-lg">
                            <li><FooterLink to="/stories">Yatri Diaries</FooterLink></li>
                            <li><FooterLink to="/stories/new">Write a Story</FooterLink></li>
                            <li><FooterExternal href="#">Local Partners</FooterExternal></li>
                            <li><FooterExternal href="#">Trust & Roots</FooterExternal></li>
                        </ul>
                    </div>

                    {/* Follow / Socials */}
                    <div className="md:col-span-3">
                        <p className="text-xs uppercase tracking-widest opacity-70 mb-4">Follow along</p>
                        <div className="flex flex-wrap gap-3">
                            {SOCIALS.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={s.label}
                                    data-testid={`social-${s.label.toLowerCase().replace(/[^a-z]/g, "")}`}
                                    className="w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                                    style={{ borderColor: "rgb(var(--by-text) / 0.2)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgb(var(--by-primary))"; e.currentTarget.style.color = "rgb(var(--by-bg))"; e.currentTarget.style.borderColor = "rgb(var(--by-primary))"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "inherit"; e.currentTarget.style.borderColor = "rgb(var(--by-text) / 0.2)"; }}
                                >
                                    <s.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>

                        <p className="text-xs uppercase tracking-widest opacity-70 mt-8 mb-3">Say Namaste</p>
                        <a href="mailto:hello@budgetyaatra.in" className="font-editorial text-lg hover:italic transition-all inline-flex items-center gap-1">
                            hello@budgetyaatra.in <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t" style={{ borderColor: "rgb(var(--by-text) / 0.08)" }}>
                    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
                        <p className="font-editorial-italic opacity-80">
                            Built with chai & long conversations · Bharat, {year}
                        </p>
                        <div className="flex flex-wrap gap-6 opacity-70">
                            <a href="#" className="hover:underline">Privacy</a>
                            <a href="#" className="hover:underline">Terms</a>
                            <a href="#" className="hover:underline">Roots pledge</a>
                            <span className="hidden md:inline">·</span>
                            <span>© {year} Budget Yaatra</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ to, children }) {
    return (
        <Link to={to} className="group inline-flex items-center gap-1 transition-opacity duration-300 hover:opacity-100 opacity-80">
            <span className="group-hover:italic transition-all">{children}</span>
            <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </Link>
    );
}

function FooterExternal({ href, children }) {
    return (
        <a href={href} className="group inline-flex items-center gap-1 transition-opacity duration-300 hover:opacity-100 opacity-80">
            <span className="group-hover:italic transition-all">{children}</span>
            <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </a>
    );
}
