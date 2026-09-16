import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, ShieldCheck, ArrowRight, Sparkles, RefreshCw, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal({ isOpen, onClose }) {
    const { sendOtp, verifyOtp } = useAuth();
    
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [debugOtp, setDebugOtp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);

    if (!isOpen) return null;

    const handleSendOtp = async (e) => {
        e?.preventDefault();
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        try {
            const res = await sendOtp(phone);
            setDebugOtp(res.debug_otp);
            setStep(2);
            toast.success(`OTP sent to ${res.phone_number || phone}`);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Failed to send OTP. Please check the number.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e?.preventDefault();
        if (!otp || otp.trim().length < 6) {
            toast.error("Please enter the 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            await verifyOtp(phone, otp.trim(), name);
            toast.success("Welcome to Budget Yaatra! 🏔️");
            handleClose();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Incorrect OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setPhone("");
        setOtp("");
        setName("");
        setDebugOtp(null);
        setShowReasonModal(false);
        onClose();
    };

    const autofillDebugOtp = () => {
        if (debugOtp) {
            setOtp(debugOtp);
            toast.info(`Autofilled OTP: ${debugOtp}`);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-md bg-[#FAF6EE] text-[#1C1917] rounded-3xl p-6 md:p-8 shadow-2xl border border-amber-900/10 z-10 overflow-hidden"
                >
                    {/* Background accent glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-200/60 transition text-stone-500 hover:text-stone-900 z-10"
                        data-testid="auth-modal-close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Inner Pop-up Explanation Overlay */}
                    <AnimatePresence>
                        {showReasonModal && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 z-20 bg-[#FAF6EE] p-6 rounded-3xl flex flex-col justify-between overflow-y-auto border border-amber-900/20 shadow-xl"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4 border-b border-stone-200 pb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-amber-800/10 text-amber-800 flex items-center justify-center font-bold">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <h3 className="font-display text-xl font-bold text-stone-900">
                                                Why Mobile Verification?
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => setShowReasonModal(false)}
                                            className="p-1.5 rounded-full hover:bg-stone-200/70 text-stone-500 hover:text-stone-900 transition"
                                            data-testid="close-reason-modal"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="space-y-3 text-xs text-stone-700 leading-relaxed font-sans">
                                        <div className="p-3.5 bg-white border border-stone-200/80 rounded-2xl flex gap-3 shadow-sm">
                                            <span className="text-xl shrink-0">✉️</span>
                                            <div>
                                                <strong className="block text-stone-900 font-semibold mb-0.5 text-sm">
                                                    Why not Email or Google login?
                                                </strong>
                                                Emails & Google accounts can be created multiple times in seconds. This leads to fake reviews, duplicate accounts, and commercial spam ruining genuine travel discovery.
                                            </div>
                                        </div>

                                        <div className="p-3.5 bg-white border border-stone-200/80 rounded-2xl flex gap-3 shadow-sm">
                                            <span className="text-xl shrink-0">🏔️</span>
                                            <div>
                                                <strong className="block text-stone-900 font-semibold mb-0.5 text-sm">
                                                    Genuine Bharat Yatris Only
                                                </strong>
                                                Mobile verification ensures every story, local dhaba review, and homestay rating comes from an authentic, verified human traveller.
                                            </div>
                                        </div>

                                        <div className="p-3.5 bg-white border border-stone-200/80 rounded-2xl flex gap-3 shadow-sm">
                                            <span className="text-xl shrink-0">🔒</span>
                                            <div>
                                                <strong className="block text-stone-900 font-semibold mb-0.5 text-sm">
                                                    100% Privacy & Zero Spam
                                                </strong>
                                                Your mobile number is encrypted & used only for authentication. We never send promotional spam or share your details.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowReasonModal(false)}
                                    className="w-full mt-4 py-3 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-medium text-xs transition shadow-md flex items-center justify-center gap-1.5"
                                >
                                    <span>Understood, let's continue</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header */}
                    <div className="mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-amber-700/10 flex items-center justify-center text-amber-700 mb-4 shadow-inner">
                            {step === 1 ? <Phone className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                        <h2 className="font-display text-3xl font-bold tracking-tight text-stone-900">
                            {step === 1 ? "Authentic Yatri Login" : "Verify Mobile OTP"}
                        </h2>
                        <p className="text-sm text-stone-600 mt-1">
                            {step === 1
                                ? "Enter your phone number to sign in & access authentic local stays & contact details."
                                : `Enter the 6-digit OTP sent to +91 ${phone.replace(/\D/g, "")}`}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                                    Mobile Number
                                </label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3.5 flex items-center gap-1.5 text-stone-600 font-medium text-sm border-r border-stone-300 pr-2.5">
                                        <span>🇮🇳</span>
                                        <span>+91</span>
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="98765 43210"
                                        maxLength={13}
                                        autoFocus
                                        data-testid="phone-input"
                                        className="w-full pl-24 pr-4 py-3 bg-white border border-stone-300 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700 font-mono text-base transition shadow-sm"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs mt-2 px-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowReasonModal(true)}
                                        className="text-amber-800 hover:text-amber-900 font-medium underline flex items-center gap-1.5 transition"
                                        data-testid="why-phone-link"
                                    >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        <span>Why do we ask for your phone number?</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || phone.replace(/\D/g, "").length < 10}
                                data-testid="send-otp-btn"
                                className="w-full py-3.5 px-6 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {loading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Send Verification OTP</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="pt-2 text-center">
                                <p className="text-xs text-stone-500">
                                    🔒 Genuine Bharat travel discovery. No spam, only verified Yatris.
                                </p>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            {/* Dev Helper Banner */}
                            {debugOtp && (
                                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-amber-900">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                                        <span>Demo OTP: <strong className="font-mono text-sm tracking-wider">{debugOtp}</strong></span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={autofillDebugOtp}
                                        className="px-2.5 py-1 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition"
                                    >
                                        Auto-fill
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                                    Your Full Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Rahul Sharma"
                                    data-testid="name-input"
                                    className="w-full px-4 py-3 bg-white border border-stone-300 rounded-2xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700 text-sm transition shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
                                    Enter 6-Digit OTP
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="• • • • • •"
                                    maxLength={6}
                                    autoFocus
                                    data-testid="otp-input"
                                    className="w-full text-center tracking-[0.5em] font-mono text-xl py-3.5 bg-white border border-stone-300 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-700/50 focus:border-amber-700 transition shadow-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                data-testid="verify-otp-btn"
                                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                            >
                                {loading ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span>Verify & Start Yatra</span>
                                )}
                            </button>

                            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="hover:underline text-stone-700"
                                >
                                    ← Change number
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    className="hover:underline text-amber-800 font-medium"
                                >
                                    Resend OTP
                                </button>
                            </div>
                        </form>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
