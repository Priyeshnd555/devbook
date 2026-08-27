"use client";

import React from "react";
import { motion } from "framer-motion";

interface CurvedLineProps {
    start: { x: number, y: number };
    end: { x: number, y: number };
    active?: boolean;
}

export const CurvedLine: React.FC<CurvedLineProps> = ({ start, end, active = false }) => {
    // S-curve path for horizontal connection
    const midX = (start.x + end.x) / 2;
    const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

    return (
        <svg className={`absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0 ${active ? 'text-primary' : 'text-border'}`}>
            <motion.path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeOpacity={active ? 0.3 : 0.15}
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
            {active && (
                <motion.path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.05}
                    strokeWidth="2"
                    className="blur-sm"
                    animate={{ opacity: [0.05, 0.1, 0.05] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            )}
        </svg>
    );
};
