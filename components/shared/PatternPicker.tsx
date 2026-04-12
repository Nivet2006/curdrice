"use client";

import { useEffect, useRef, useState } from "react";
import { usePattern, PatternId } from "./PatternProvider";

const PATTERNS: { id: PatternId; label: string; preview: string }[] = [
    {
        id: "none",
        label: "None",
        preview: "bg-transparent",
    },
    {
        id: "grid",
        label: "Grid",
        preview: "pattern-preview-grid",
    },
    {
        id: "dots",
        label: "Dots",
        preview: "pattern-preview-dots",
    },
    {
        id: "cross",
        label: "Cross",
        preview: "pattern-preview-cross",
    },
    {
        id: "diagonal",
        label: "Lines",
        preview: "pattern-preview-diagonal",
    },
    {
        id: "waves",
        label: "Waves",
        preview: "pattern-preview-waves",
    },
    {
        id: "hexagon",
        label: "Hex",
        preview: "pattern-preview-hexagon",
    },
];

export default function PatternPicker() {
    const { pattern, setPattern } = usePattern();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            {/* Trigger button */}
            <button
                onClick={() => setOpen((v) => !v)}
                title="Change background pattern"
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "1.5px solid var(--border)",
                    background: "var(--bg-subtle)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "border-color 0.15s, background 0.15s",
                    flexShrink: 0,
                }}
            >
                {/* Grid icon SVG */}
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <rect
                        x="1"
                        y="1"
                        width="5"
                        height="5"
                        rx="1"
                        stroke="var(--fg)"
                        strokeWidth="1.4"
                    />
                    <rect
                        x="10"
                        y="1"
                        width="5"
                        height="5"
                        rx="1"
                        stroke="var(--fg)"
                        strokeWidth="1.4"
                    />
                    <rect
                        x="1"
                        y="10"
                        width="5"
                        height="5"
                        rx="1"
                        stroke="var(--fg)"
                        strokeWidth="1.4"
                    />
                    <rect
                        x="10"
                        y="10"
                        width="5"
                        height="5"
                        rx="1"
                        stroke="var(--fg)"
                        strokeWidth="1.4"
                    />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 10px)",
                        right: 0,
                        background: "var(--bg-card, var(--bg))",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: "14px 12px",
                        boxShadow:
                            "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                        zIndex: 9999,
                        minWidth: 220,
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <p
                        style={{
                            fontSize: 10,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--fg-muted, #888)",
                            marginBottom: 10,
                            paddingLeft: 2,
                        }}
                    >
                        Background Pattern
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 8,
                        }}
                    >
                        {PATTERNS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setPattern(p.id);
                                    setOpen(false);
                                }}
                                title={p.label}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 5,
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: 0,
                                }}
                            >
                                {/* Mini preview swatch */}
                                <div
                                    className={`pattern-swatch pattern-swatch-${p.id}`}
                                    style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 8,
                                        border:
                                            pattern === p.id
                                                ? "2px solid var(--accent, #000)"
                                                : "1.5px solid var(--border)",
                                        overflow: "hidden",
                                        background: "var(--bg)",
                                        transition: "border-color 0.15s",
                                        position: "relative",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: 9,
                                        fontWeight: pattern === p.id ? 700 : 500,
                                        color:
                                            pattern === p.id
                                                ? "var(--accent, var(--fg))"
                                                : "var(--fg-muted, #888)",
                                        letterSpacing: "0.04em",
                                        transition: "color 0.15s",
                                    }}
                                >
                                    {p.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
