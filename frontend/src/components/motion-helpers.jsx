import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function ScrollProgress() {
    const [scaleX, setScaleX] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const total = h.scrollHeight - h.clientHeight;
            const p = total > 0 ? h.scrollTop / total : 0;
            setScaleX(p);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, []);
    return <div className="scroll-progress" style={{ transform: `scaleX(${scaleX})` }} />;
}

export function PageFade({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    );
}

// Auto reveal-up when element enters viewport
export function useRevealOnScroll() {
    const ref = useRef(null);
    useEffect(() => {
        if (!ref.current) return;
        const el = ref.current;
        el.classList.add("reveal-up");
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        el.classList.add("in-view");
                        io.unobserve(el);
                    }
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -50px 0px" },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return ref;
}
