import React, { createContext, useContext, useState, useCallback } from "react";

const ThemeContext = createContext({ destination: "base", setDestination: () => {} });

export function ThemeProvider({ children }) {
    const [destination, setDestinationState] = useState("base");

    const setDestination = useCallback((slug) => {
        setDestinationState(slug || "base");
        if (typeof document !== "undefined") {
            if (!slug || slug === "base") {
                document.documentElement.removeAttribute("data-destination");
            } else {
                document.documentElement.setAttribute("data-destination", slug);
            }
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ destination, setDestination }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
