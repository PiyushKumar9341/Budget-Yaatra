import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ChatDrawer({ open, onClose, destSlug, destName }) {
    const [sessionId] = useState(() => "sess_" + Math.random().toString(36).slice(2, 12));
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [streaming, setStreaming] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (open && messages.length === 0) {
            setMessages([{ role: "assistant", text: `Namaste! Main Yatri hoon 🙏 Poocho kuch bhi ${destName ? destName + " ke baare me" : "apni yatra ke liye"} — budget, weather, kya khaana, kaha sona, sab.` }]);
        }
    }, [open, destName, messages.length]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        if (!input.trim() || streaming) return;
        const userMsg = input.trim();
        setInput("");
        setMessages((m) => [...m, { role: "user", text: userMsg }, { role: "assistant", text: "" }]);
        setStreaming(true);

        try {
            const res = await fetch(`${API}/chat/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session_id: sessionId, message: userMsg, destination_slug: destSlug }),
            });
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop();
                for (const part of parts) {
                    if (!part.startsWith("data: ")) continue;
                    try {
                        const data = JSON.parse(part.slice(6));
                        if (data.delta) {
                            setMessages((m) => {
                                const copy = [...m];
                                copy[copy.length - 1] = { ...copy[copy.length - 1], text: copy[copy.length - 1].text + data.delta };
                                return copy;
                            });
                        }
                        if (data.error) {
                            setMessages((m) => {
                                const copy = [...m];
                                copy[copy.length - 1] = { role: "assistant", text: "⚠️ " + data.error };
                                return copy;
                            });
                        }
                    } catch (err) {
                        console.warn("[ChatDrawer] SSE chunk parse failed:", err?.message || err);
                    }
                }
            }
        } catch (e) {
            setMessages((m) => [...m, { role: "assistant", text: "Kuch gadbad ho gayi. Try again?" }]);
        } finally {
            setStreaming(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-40" onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 260 }}
                        className="fixed top-0 right-0 h-full w-full md:w-[500px] z-50 flex flex-col"
                        style={{ background: "rgb(var(--by-bg))" }}
                        data-testid="chat-drawer"
                    >
                        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "rgb(var(--by-text) / 0.08)" }}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" style={{ color: "rgb(var(--by-primary))" }} />
                                    <span className="text-xs uppercase tracking-widest opacity-70">Powered by Gemini</span>
                                </div>
                                <h3 className="font-display text-2xl mt-1 tracking-tight">Yatri</h3>
                            </div>
                            <button onClick={onClose} data-testid="chat-close" className="p-2 hover:opacity-70"><X className="w-5 h-5" /></button>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((m, i) => (
                                <div key={i} className={m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{m.text}{m.role === "assistant" && streaming && i === messages.length - 1 && <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t flex items-center gap-2" style={{ borderColor: "rgb(var(--by-text) / 0.08)" }}>
                            <input
                                data-testid="chat-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && send()}
                                placeholder="Ask Yatri anything..."
                                className="by-input flex-1"
                                disabled={streaming}
                            />
                            <button data-testid="chat-send" onClick={send} disabled={streaming || !input.trim()} className="pill-btn disabled:opacity-40 py-2 px-4">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
