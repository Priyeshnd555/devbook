"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, ChevronRight, Layers, Clock, CheckCircle2 } from "lucide-react";
import { FolderedProject } from "../types";

interface FolderNodeProps {
    data: FolderedProject;
    onThreadClick: (projectId: string, threadId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    depth?: number;
}

export const FolderNode: React.FC<FolderNodeProps> = ({
    data,
    onThreadClick,
    isExpanded,
    onToggleExpand,
    depth = 0
}) => {
    const displayThreads = useMemo(() => {
        if (!isExpanded) return [];
        return data.directThreadsWithContext;
    }, [data.directThreadsWithContext, isExpanded]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`group flex flex-col transition-all duration-300 rounded border overflow-hidden relative z-20 
                ${data.isFullyCompleted
                    ? 'bg-foreground/[0.01] border-border opacity-40 grayscale'
                    : 'bg-surface border-border hover:border-text-secondary/20'
                }
                ${isExpanded ? 'min-w-[360px]' : 'w-72'}`}
        >
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 p-2 rounded ${data.isFullyCompleted ? 'text-foreground/20' : depth === 0 ? 'text-primary' : 'text-foreground/30'}`}>
                            <Hexagon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                            {depth > 0 && data.breadcrumb && (() => {
                                const parts = data.breadcrumb.split(' / ');
                                return (
                                    <div className="flex items-center gap-1 flex-wrap mb-1">
                                        {parts.map((part, i) => (
                                            <React.Fragment key={i}>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider leading-none transition-colors
                                                    ${i === parts.length - 1
                                                        ? (data.isFullyCompleted ? 'text-foreground/30' : 'text-foreground/90')
                                                        : 'text-foreground/20'}`}>
                                                    {part}
                                                </span>
                                                {i < parts.length - 1 && (
                                                    <ChevronRight className="w-2.5 h-2.5 text-foreground/15 shrink-0" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                );
                            })()}
                            {depth === 0 && (
                                <h3 className={`text-sm font-medium truncate tracking-tight transition-colors ${data.isFullyCompleted ? 'text-foreground/30' : 'text-text-primary'}`}>
                                    {data.projectName}
                                </h3>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className={`text-[11px] font-black tabular-nums ${data.isFullyCompleted ? 'text-foreground/20' : 'text-primary'}`}>
                            {data.progress}%
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpand();
                            }}
                            className={`p-1.5 rounded transition-all ${isExpanded ? 'text-primary' : 'text-text-secondary/40 hover:text-text-primary'}`}
                        >
                            <Layers className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="popLayout">
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex flex-col gap-2 pt-4 border-t border-border/10"
                        >
                            {displayThreads.length > 0 ? displayThreads.map((thread) => (
                                <motion.div
                                    key={thread.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`flex flex-col justify-between p-4 rounded border transition-all cursor-pointer group/thread relative overflow-hidden
                                        ${!thread.hasPending
                                            ? 'bg-foreground/[0.01] border-border opacity-30 grayscale pointer-events-none'
                                            : 'bg-surface border-border hover:border-text-secondary/20'}`}
                                    onClick={() => onThreadClick(data.projectId, thread.id)}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <span className={`text-[12px] font-bold leading-snug ${!thread.hasPending ? 'text-foreground/20' : 'text-foreground/90 group-hover/thread:text-foreground'} transition-colors`}>
                                            {thread.title}
                                        </span>
                                        <div className={`shrink-0 px-2 py-0.5 rounded border ${!thread.hasPending ? 'border-border' : 'border-primary/20'}`}>
                                            <span className={`text-[9px] font-medium tabular-nums ${!thread.hasPending ? 'text-foreground/20' : 'text-primary'}`}>
                                                {thread.visibleTasks.length}
                                            </span>
                                        </div>
                                    </div>
                                    {thread.breadcrumb && thread.isChild && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-foreground/20 font-semibold uppercase tracking-wider">
                                            <Layers className="w-2.5 h-2.5" />
                                            <span className="truncate">{thread.breadcrumb.split(' / ').slice(1).join(' / ')}</span>
                                        </div>
                                    )}
                                    {!thread.hasPending && (
                                        <div className="flex items-center gap-1.5 text-[10px] text-foreground/20 font-semibold uppercase tracking-wider mt-1">
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            <span>Completed</span>
                                        </div>
                                    )}
                                    {thread.hasPending && (
                                        <div className="absolute inset-0 bg-primary/0 group-hover/thread:bg-primary/[0.03] transition-colors pointer-events-none" />
                                    )}
                                </motion.div>
                            )) : (
                                <div className="text-[11px] font-semibold text-foreground/10 uppercase tracking-widest py-4 text-center">No Active Threads</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!data.isFullyCompleted && !isExpanded && (
                    <div className="mt-auto pt-3 border-t border-border/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-foreground/20">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">{data.pendingDays}d pending</span>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
