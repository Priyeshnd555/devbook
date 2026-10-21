"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
    LayoutDashboard, 
    ChevronLeft, 
    ChevronRight, 
    Share2, 
    Activity, 
    Layers, 
    Hexagon, 
    CheckCircle2 
} from "lucide-react";
import { FolderNode } from "./FolderNode";
import { useWeeklyManager } from "../hooks/useWeeklyManager";
import { WeeklyOverviewItem } from "../types";

interface WeeklyDashboardProps {
    weeklyOverviewData: WeeklyOverviewItem[];
    handleSelectProject: (id: string) => void;
    handleSelectThread: (id: string) => void;
}

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({
    weeklyOverviewData,
    handleSelectProject,
    handleSelectThread,
}) => {
    const {
        weekOffset,
        setWeekOffset,
        expandedNodes,
        viewMode,
        setViewMode,
        selectedDate,
        setSelectedDate,
        weekDates,
        todayStr,
        toggleNodeExpand,
        handleThreadClick,
        treeData
    } = useWeeklyManager(weeklyOverviewData, handleSelectProject, handleSelectThread);

    const handleGoToToday = () => {
        setWeekOffset(0);
        setSelectedDate(todayStr);
    };

    return (
        <div className={`${viewMode === 'tree' ? 'w-full' : 'max-w-7xl mx-auto'} py-8 px-8`}>
            {/* Interactive Date Selector */}
            <div className="flex justify-between mb-6">
                <div className="flex items-center gap-4 p-2 bg-surface/90 backdrop-blur-2xl rounded-2xl border border-border/10 shadow-2xl overflow-hidden max-w-full">
                    {/* Left: Prev & Today */}
                    <div className="flex items-center gap-1.5 pl-1">
                        <button
                            onClick={() => setWeekOffset(prev => prev - 1)}
                            className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/30 hover:text-foreground transition-all"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleGoToToday}
                            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all border ${selectedDate === todayStr && weekOffset === 0
                                ? "bg-primary/20 border-primary/30 text-primary"
                                : "bg-foreground/5 border-border/20 text-foreground/30 hover:text-foreground"
                                }`}
                        >
                            Today
                        </button>
                    </div>

                    <div className="h-8 w-px bg-border/20" />

                    {/* Center: Date Chips */}
                    <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                        {weekDates.map((day) => (
                            <button
                                key={day.date}
                                onClick={() => setSelectedDate(day.date)}
                                className={`flex flex-col items-center min-w-[64px] px-2.5 py-2 rounded-xl transition-all duration-300 relative group ${selectedDate === day.date
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10"
                                    : "text-foreground/20 hover:text-foreground/50 hover:bg-foreground/[0.02]"
                                    }`}
                            >
                                <span className={`text-[8px] font-bold uppercase tracking-wider mb-0.5 ${selectedDate === day.date ? 'text-white/80' : 'text-foreground/20 group-hover:text-foreground/40'}`}>
                                    {day.name.slice(0, 3)}
                                </span>
                                <span className="text-xs font-black tracking-tight">{day.day}</span>
                                {selectedDate === day.date && (
                                    <motion.div
                                        layoutId="activeDate"
                                        className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-white"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-border/20" />

                    {/* Right: Next & Context Info */}
                    <div className="flex items-center gap-4 pr-4">
                        <button
                            onClick={() => setWeekOffset(prev => prev + 1)}
                            className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/30 hover:text-foreground transition-all"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-end min-w-[90px]">
                            <span className="text-sm font-black text-foreground/90 tracking-tight leading-none">
                                {new Date(weekDates[0].date).toLocaleString('default', { month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-right text-[8px] font-bold text-foreground/20 uppercase tracking-[0.2em] mt-1">
                                Week {weekDates[0].weekNumber}
                            </span>
                        </div>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-foreground/[0.02] rounded-xl border border-border/10">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'table' ? "bg-surface text-primary shadow-sm border border-border/50" : "text-foreground/30 hover:text-foreground"}`}
                    >
                        <LayoutDashboard className="w-3 h-3" />
                        <span>Table</span>
                    </button>
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'tree' ? "bg-surface text-primary shadow-sm border border-border/50" : "text-foreground/30 hover:text-foreground"}`}
                    >
                        <Share2 className="w-3 h-3" />
                        <span>Tree</span>
                    </button>
                </div>
            </div>

            <div className="relative">
                {viewMode === 'table' ? (
                    <div className="flex flex-col gap-8">
                        {treeData.map((root) => {
                            const allRelevantThreads = root.allThreadsWithContext;
                            return (
                                <motion.div
                                    key={root.projectId}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`group relative flex flex-col gap-6 rounded-3xl transition-all ${root.isFullyCompleted ? 'opacity-40 grayscale' : ''}`}
                                >
                                    {/* Project Header Card */}
                                    <div className="flex items-center justify-between ">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${root.isFullyCompleted ? 'bg-foreground/5 text-foreground/20' : 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-primary/10'}`}>
                                                <Hexagon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground/90">{root.projectName}</h3>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-24 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${root.progress}%` }}
                                                                className="h-full bg-primary"
                                                            />
                                                        </div>
                                                        <span className="text-xs font-bold text-foreground/40 tabular-nums">{root.progress}%</span>
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                                    <span className="text-[10px] text-foreground/20 font-bold uppercase tracking-widest">{allRelevantThreads.length} Active Threads</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Threads Area */}
                                    <div className="flex flex-wrap gap-4 pb-2 px-2">
                                        {allRelevantThreads.length > 0 ? (
                                            allRelevantThreads.map((thread) => (
                                                <motion.div
                                                    key={thread.id}
                                                    whileHover={{ y: -5, scale: 1.02 }}
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`flex flex-col justify-between p-5 rounded-2xl border w-[280px] max-w-[340px] transition-all cursor-pointer shadow-xl relative overflow-hidden group/card
                                                        ${!thread.hasPending
                                                            ? 'bg-foreground/[0.01] border-border/10 opacity-30 grayscale pointer-events-none'
                                                            : 'bg-primary/[0.08] border-primary/20 hover:border-primary/40 hover:bg-primary/[0.12]'}`}
                                                    onClick={() => handleThreadClick(root.projectId, thread.id)}
                                                >
                                                    <div className="relative z-10">
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <span className={`text-sm font-bold leading-snug transition-colors ${!thread.hasPending ? 'text-foreground/30' : 'text-foreground/90 group-hover/card:text-foreground'}`}>
                                                                {thread.title}
                                                            </span>
                                                            <div className={`shrink-0 px-2 py-1 rounded-lg border ${!thread.hasPending ? 'bg-foreground/5 border-border/10' : 'bg-primary/15 border-primary/20'}`}>
                                                                <span className={`text-[11px] font-bold tabular-nums ${!thread.hasPending ? 'text-foreground/20' : 'text-primary'}`}>
                                                                    {thread.visibleTasks.length}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {thread.breadcrumb && thread.isChild && (
                                                            <div className="flex items-center gap-2 text-xs text-foreground/20 font-semibold uppercase tracking-wider">
                                                                <Layers className="w-3 h-3" />
                                                                <span className="truncate">
                                                                    {thread.breadcrumb.split(' / ').slice(1).join(' / ')}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {!thread.hasPending && (
                                                            <div className="flex items-center gap-1.5 text-[10px] text-foreground/20 font-semibold uppercase tracking-wider mt-1">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                <span>Completed</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="absolute inset-0 bg-primary/0 group-hover/card:bg-primary/[0.03] transition-colors pointer-events-none" />
                                                </motion.div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-full py-12 rounded-2xl border border-dashed border-border/10 bg-foreground/[0.01]">
                                                <Activity className="w-6 h-6 text-foreground/5 mb-2" />
                                                <span className="text-[11px] font-bold text-foreground/10 uppercase tracking-[0.2em]">Deployment Clear</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-px bg-gradient-to-r from-transparent via-border/10 to-transparent mt-4" />
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-row items-start gap-12 justify-start w-full pb-8 overflow-x-auto custom-scrollbar">
                        {treeData.map((root) => (
                            <div key={root.projectId} className="flex flex-col items-center shrink-0">
                                <div className="relative">
                                    <FolderNode
                                        data={root}
                                        onThreadClick={handleThreadClick}
                                        isExpanded={expandedNodes.has(root.projectId)}
                                        onToggleExpand={() => toggleNodeExpand(root.projectId)}
                                        depth={0}
                                    />
                                </div>

                                <div className="flex items-start gap-6 relative flex-wrap justify-center mt-10">
                                    {expandedNodes.has(root.projectId) && root.subfolders.length > 1 && (
                                        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                    )}

                                    {expandedNodes.has(root.projectId) && root.subfolders.map((child, idx) => (
                                        <div key={child.projectId} className="flex flex-col items-center gap-12 relative">
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[2px] h-12 bg-gradient-to-b from-primary/30 to-transparent blur-[0.5px]" />
                                            {idx === Math.floor(root.subfolders.length / 2) && (
                                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[2px] h-4 bg-primary/40 blur-[1px]" />
                                            )}

                                            <FolderNode
                                                data={child}
                                                onThreadClick={handleThreadClick}
                                                isExpanded={expandedNodes.has(child.projectId)}
                                                onToggleExpand={() => toggleNodeExpand(child.projectId)}
                                                depth={1}
                                            />

                                            <div className="flex items-start gap-6 relative flex-wrap justify-center mt-8">
                                                {expandedNodes.has(child.projectId) && child.subfolders.map((grandchild) => (
                                                    <div key={grandchild.projectId} className="relative flex flex-col items-center">
                                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[2px] h-12 bg-gradient-to-b from-primary/40 via-primary/10 to-transparent blur-[1px]" />
                                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-primary/20 bg-primary/10 -translate-y-1/2 blur-sm animate-pulse" />

                                                        <FolderNode
                                                            data={grandchild}
                                                            onThreadClick={handleThreadClick}
                                                            isExpanded={expandedNodes.has(grandchild.projectId)}
                                                            onToggleExpand={() => toggleNodeExpand(grandchild.projectId)}
                                                            depth={2}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {treeData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-48 opacity-20">
                        <Hexagon className="w-16 h-16 mb-4 text-foreground animate-pulse" />
                        <h3 className="text-xl font-bold uppercase tracking-[0.4em] text-foreground/50">Frequency Silent</h3>
                        <p className="text-[10px] text-foreground/20 font-bold uppercase tracking-widest mt-2">No active projects found for this cycle</p>
                    </div>
                )}
            </div>
        </div>
    );
};
