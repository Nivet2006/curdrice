"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type PatternId =
    | "none"
    | "grid"
    | "dots"
    | "cross"
    | "diagonal"
    | "waves"
    | "hexagon"
    | "diamonds"
    | "circuit"
    | "polka"
    | "scales"
    | "zigzag";

interface PatternContextValue {
    pattern: PatternId;
    setPattern: (p: PatternId) => void;
}

const PatternContext = createContext<PatternContextValue>({
    pattern: "grid",
    setPattern: () => { },
});

export function PatternProvider({ children }: { children: React.ReactNode }) {
    const [pattern, setPatternState] = useState<PatternId>("grid");

    useEffect(() => {
        const saved = localStorage.getItem("bg-pattern") as PatternId | null;
        if (saved) setPatternState(saved);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute("data-pattern", pattern);
        localStorage.setItem("bg-pattern", pattern);
    }, [pattern]);

    const setPattern = (p: PatternId) => setPatternState(p);

    return (
        <PatternContext.Provider value={{ pattern, setPattern }}>
            {children}
        </PatternContext.Provider>
    );
}

export const usePattern = () => useContext(PatternContext);
