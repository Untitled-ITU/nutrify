"use client";

import { useState } from "react";

type Props = {
    text?: string | null;
    maxChars?: number;
};

export function TruncatedText({ text, maxChars = 120 }: Props) {
    const [expanded, setExpanded] = useState(false);

    if (!text) return <span>—</span>;

    const isLong = text.length > maxChars;
    const visibleText = expanded || !isLong
        ? text
        : text.slice(0, maxChars) + "…";

    return (
        <span>
            {visibleText}
            {isLong && (
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="ml-1 text-blue-600 hover:underline font-extrabold"
                >
                    {expanded ? "See less" : "See more"}
                </button>
            )}
        </span>
    );
}
