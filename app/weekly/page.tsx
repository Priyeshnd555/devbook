"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    LayoutDashboard,
    Clock,
    ChevronLeft,
    ChevronRight,
    ArrowLeft,
    Share2,
    Activity,
    Target,
    Layers,
    Hexagon,
    CheckCircle2,
    Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useWorkflowManager from "../hooks/useWorkflowManager";
import { getWeekDates } from "../utils/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import ProjectSidebar from "../components/ProjectSidebar";
import ProjectNavigator from "../components/ProjectNavigator";
import HeaderActions from "../components/HeaderActions";
import SettingsModal from "../components/SettingsModal";
import GlobalHeader from "../components/GlobalHeader";
import { Task } from "../types";

/**
 * =================================================================================================
 * CONTEXT ANCHOR: WEEKLY ROADMAP DASHBOARD (app/weekly/page.tsx)
 * =================================================================================================
 *
 * @purpose
 * Implements the Weekly Planning dashboard — a high-level, read-only overview of all projects
 * and threads in the system. It provides two distinct view modes:
 * 1. TABLE VIEW (default): Horizontal scroll rows of Thread cards grouped by root project.
 * 2. TREE VIEW:  Hierarchical graph of project folder nodes, expandable up to 3 levels.
 *
 * @theming
 * ALL colors use semantic CSS variable tokens from globals.css / ThemeProvider, NEVER hardcoded
 * hex or rgba values. Token mapping:
 *   - bg-background      → var(--color-background): page root background
 *   - bg-surface         → var(--color-surface): elevated card surfaces
 *   - text-foreground    → var(--color-text-primary): primary readable text
 *   - text-foreground/NN → foreground with opacity for secondary/muted text
 *   - border-border      → var(--color-border): dividers and card outlines
 *   - text-primary       → var(--color-primary): accent color (changes with theme)
 *   - bg-primary         → var(--color-primary): accent fill
 *   - bg-surface/80      → surface with backdrop transparency for sticky/glass elements
 * INVARIANT: No hardcoded hex, rgb(), or rgba() color values are allowed in this file.
 *
 * @dependencies
 * - HOOK: `useWorkflowManager` — the single source of truth for all project/thread/task data.
 *   The key derived state used here is `weeklyOverviewData` (see useWorkflowManager.ts).
 * - UTIL: `getWeekDates` (dateUtils.ts) — generates the 7-day date chip array for weekly navigation.
 * - COMPONENT: `FolderNode` — renders a single project node card in the Tree view.
 * - COMPONENT: `CurvedLine` — draws an SVG Bezier connector between tree nodes.
 * - COMPONENTS: `ProjectSidebar`, `ProjectNavigator`, `HeaderActions`, `SettingsModal` — shared chrome.
 *
 * @state_management
 * - `weekOffset` (number): Controls which calendar week is displayed. 0 = current week.
 * - `selectedDate` (string): ISO date string for the currently selected day chip (YYYY-MM-DD).
 * - `viewMode` ('table' | 'tree'): Controls which rendering layout is active.
 * - `expandedNodes` (Set<string>): Set of project IDs that are expanded in the Tree view.
 * - `isSidebarVisible`, `isSettingsModalOpen`: Local UI state for sidebar and settings overlay.
 *
 * @key_data_transforms
 * - `treeData`: A memoized, recursive `FolderedProject[]` array that is the single source of
 *   truth for BOTH views. It is derived from `weeklyOverviewData` and `selectedDate`.
 * - Thread cards in both views show `visibleTasks`: tasks that are either un-done OR were
 *   completed on the `selectedDate`. This gives "what did I finish today?" context.
 * - A project/thread is grayed out (grayscale) if ALL its tasks are completed (nothing pending).
 *
 * @navigation
 * - Clicking a Thread card calls `handleThreadClick`, which selects the project+thread in
 *   `useWorkflowManager` state and navigates back to `app/page.tsx` (`/`) via `router.push`.
 *   This preserves the selected thread context across the route change.
 * - Header includes links to `/` (Explorer) and `/lucid` (Lucid Brainstorming).
 *
 * @ai_note
 * - The `treeData` memoization is the most complex part of this file. It recursively builds
 *   a tree from the flat `weeklyOverviewData` array and attaches thread context at each level.
 * - DESIGN PHILOSOPHY: Parent Row -> 3-Level Organic Tree (Hover Expansion).
 * - CONNECTORS: Organic Curved "Twine" SVG lines between tree nodes.
 * - UX: Breadcrumbs for nested context and a clear "Return to Explorer" back action.
 * =================================================================================================
 */

interface FolderedProject {
    projectId: string;
    projectName: string;
    parentId: string | null;
    progress: number;
    pendingDays: number;
    allThreadsWithContext: Array<{
        id: string;
        title: string;
        breadcrumb: string;
        isChild: boolean;
        hasPending: boolean;
        tasks: Task[];
        visibleTasks: Task[];
    }>;
    directThreadsWithContext: Array<{
        id: string;
        title: string;
        breadcrumb: string;
        isChild: boolean;
        hasPending: boolean;
        tasks: Task[];
        visibleTasks: Task[];
    }>;
    subfolders: FolderedProject[];
    breadcrumb?: string;
    isFullyCompleted: boolean;
}

interface WeekDay {
    date: string;
    name: string;
    day: string;
    month: string;
    year: number;
    weekNumber: number;
}

// =================================================================================================
// CONTEXT ANCHOR: FolderNode Component (inline, weekly/page.tsx)
// =================================================================================================
// PURPOSE: Renders a single project node in the TREE VIEW. Supports up to 3 levels of nesting
//          (root, child, grandchild) via the `depth` prop. Displays project name, progress %,
//          and an expandable list of threads belonging directly to this project (`directThreadsWithContext`).
// CONSTRAINT: Only shows `directThreadsWithContext` (not descendant threads) to avoid duplication
//             in the tree layout, since child nodes render their own threads.
// INVARIANTS: `isExpanded` is controlled externally via `expandedNodes` Set in the parent.
// THEMING: All colors use semantic CSS variable tokens. No hardcoded hex/rgb/rgba values.
// =================================================================================================
const FolderNode = ({
    data,
    onThreadClick,
    isExpanded,
    onToggleExpand,
    depth = 0
}: {
    data: FolderedProject;
    onThreadClick: (projectId: string, threadId: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
    depth?: number;
}) => {
    const displayThreads = useMemo(() => {
        if (!isExpanded) return [];
        // Tree view: Only show threads that belong directly to this project node to prevent duplication
        return data.directThreadsWithContext;
    }, [data.directThreadsWithContext, isExpanded]);


    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex flex-col transition-all duration-300 rounded-2xl relative z-20 
                ${data.isFullyCompleted
                    ? 'bg-foreground/[0.01] border-border/10 opacity-40 grayscale'
                    : 'bg-surface/80 backdrop-blur-xl border-border/20 hover:border-primary/50 shadow-2xl'
                }
                ${isExpanded ? 'min-w-[360px]' : 'w-72'}
                border overflow-hidden`}
        >
            <div className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 p-2 rounded-xl ${data.isFullyCompleted ? 'bg-foreground/5 text-foreground/20' : depth === 0 ? 'bg-primary/20 text-primary' : 'bg-foreground/5 text-foreground/40'}`}>
                            <Hexagon className="w-4 h-4" />
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
                                <h3 className={`text-sm font-bold truncate tracking-tight transition-colors ${data.isFullyCompleted ? 'text-foreground/30' : 'text-foreground/90 group-hover:text-primary'}`}>
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
                            className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-primary/20 text-primary' : 'bg-foreground/5 text-foreground/20 hover:text-foreground hover:bg-foreground/10'}`}
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
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex flex-col justify-between p-4 rounded-2xl border transition-all cursor-pointer group/thread shadow-lg relative overflow-hidden
                                        ${!thread.hasPending
                                            ? 'bg-foreground/[0.01] border-border/10 opacity-30 grayscale pointer-events-none'
                                            : 'bg-primary/[0.08] border-primary/20 hover:border-primary/40 hover:bg-primary/[0.12]'}`}
                                    onClick={() => onThreadClick(data.projectId, thread.id)}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <span className={`text-[12px] font-bold leading-snug ${!thread.hasPending ? 'text-foreground/20' : 'text-foreground/90 group-hover/thread:text-foreground'} transition-colors`}>
                                            {thread.title}
                                        </span>
                                        <div className={`shrink-0 px-2 py-0.5 rounded-lg border ${!thread.hasPending ? 'bg-foreground/5 border-border/10' : 'bg-primary/15 border-primary/20'}`}>
                                            <span className={`text-[10px] font-bold tabular-nums ${!thread.hasPending ? 'text-foreground/20' : 'text-primary'}`}>
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

// =================================================================================================
// CONTEXT ANCHOR: CurvedLine Component (inline, weekly/page.tsx)
// =================================================================================================
// PURPOSE: Draws an SVG Bezier "twine" connector between two tree nodes.
// THEMING: Uses `currentColor` + CSS variable trick to avoid hardcoded rgba values.
//          Active lines use `text-primary` color class; inactive use `text-border`.
// =================================================================================================
const CurvedLine = ({ start, end, active = false }: { start: { x: number, y: number }, end: { x: number, y: number }, active?: boolean }) => {
    // S-curve path for horizontal connection
    const midX = (start.x + end.x) / 2;
    const path = `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;

    return (
        <svg className={`absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0 ${active ? 'text-primary' : 'text-border'}`}>
            <motion.path
                d={path}
                fill="none"
                stroke="currentColor"
                strokeOpacity={active ? 0.4 : 0.2}
                strokeWidth={active ? "1.5" : "1"}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: "easeInOut" }}
            />
            {active && (
                <motion.path
                    d={path}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity={0.15}
                    strokeWidth="3"
                    className="blur-md"
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
        </svg>
    );
};

// --- Main Page Component ---
const WeeklyRoadmap = () => {
    const router = useRouter();
    const {
        projects,
        selectedProjectId,
        weeklyOverviewData,
        threads,
        expandedThreads,
        handleSelectProject,
        handleSelectThread,
        toggleThread,
        addProject,
        renameProject,
        deleteProject,
        showCompleted,
        setShowCompleted,
        globalTotalTasks,
        globalCompletedTasks
    } = useWorkflowManager();

    const [weekOffset, setWeekOffset] = useState(0);
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

    // STRATEGY: `toggleNodeExpand` manages expansion of the Tree view nodes.
    // In Tree mode, expanding a node also expands all its descendants by default
    // (since the tree is 3-level max, this is a bounded operation).
    // CONSTRAINT: In Table mode, expanding a node does NOT expand descendants.
    const toggleNodeExpand = (id: string, recursive: boolean = false) => {
        setExpandedNodes((prev: Set<string>) => {
            const next = new Set(prev);
            const isExpanding = !next.has(id);

            const getDescendants = (nodeId: string): string[] => {
                const childIds: string[] = [];
                const findChildren = (pid: string) => {
                    weeklyOverviewData.filter(p => p.parentId === pid).forEach(child => {
                        childIds.push(child.projectId);
                        findChildren(child.projectId);
                    });
                };
                findChildren(nodeId);
                return childIds;
            };

            if (isExpanding) {
                next.add(id);
                if (recursive || viewMode === 'tree') {
                    getDescendants(id).forEach(d => next.add(d));
                }
            } else {
                next.delete(id);
                if (recursive || viewMode === 'tree') {
                    getDescendants(id).forEach(d => next.delete(d));
                }
            }
            return next;
        });
    };

    const handleRootGraphClick = (projectId: string) => {
        if (viewMode === 'table') {
            setViewMode('tree');
            // When switching to tree view, expand ALL visible nodes by default
            const allVisibleIds = new Set(weeklyOverviewData.map(p => p.projectId));
            setExpandedNodes(allVisibleIds);
        } else {
            setViewMode('table');
        }
    };

    const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
    const todayStr = new Date().toISOString().split("T")[0];

    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        const weekDates = getWeekDates(0);
        return weekDates.find(d => d.date === todayStr)?.date || weekDates[0].date;
    });

    useEffect(() => {
        if (!weekDates.some(d => d.date === selectedDate) && weekDates.length > 0) {
            setSelectedDate(weekDates[0].date); // eslint-disable-line react-hooks/set-state-in-effect
        }
    }, [weekDates, selectedDate]);

    const handleGoToToday = () => {
        setWeekOffset(0);
        setSelectedDate(todayStr);
    };

    // STRATEGY: Thread navigation maintains context across the route change.
    // We call `handleSelectProject` and `handleSelectThread` on the workflow manager
    // BEFORE navigating, so that the Explorer page (`/`) hydrates with the correct selection.
    // CONSTRAINT: This is a one-way navigation. The back button returns to the roadmap.
    const handleThreadClick = (projectId: string, threadId: string) => {
        handleSelectProject(projectId);
        handleSelectThread(threadId);
        router.push('/');
    };

    // =================================================================================================
    // STRATEGY: treeData - converts flat weeklyOverviewData into a hierarchical FolderedProject tree.
    // =================================================================================================
    // This is the primary data transformation for BOTH the Table and Tree views.
    //
    // ALGORITHM (recursive buildTree):
    // 1. `buildTree(parentId, depth)` filters `weeklyOverviewData` to find projects with the given
    //    `parentId` (null for root projects).
    // 2. For each project, it calls `getAllDescendantThreads` to recursively collect threads from
    //    all sub-projects (used for the TABLE VIEW which shows all descendant threads in one row).
    // 3. It also builds `directThreadsWithContext` with only the threads belonging to THIS project
    //    (not descendants), used by the TREE VIEW to avoid duplication.
    // 4. For each thread, `visibleTasks` are calculated: un-done tasks + tasks completed on `selectedDate`.
    // 5. A project is `isFullyCompleted` if ALL its threads (including descendants) have no pending tasks.
    // 6. Projects with no relevant threads (and no relevant sub-projects) are filtered out.
    //
    // CONSTRAINT: Max depth is 3 (root, child, grandchild). `if (depth >= 3) return []` enforces this.
    // DEPENDENCIES: `weeklyOverviewData` (from useWorkflowManager), `selectedDate` (local state).
    // =================================================================================================
    const treeData: FolderedProject[] = useMemo(() => {
        const buildTree = (parentId: string | null, depth: number, breadcrumb: string = ""): FolderedProject[] => {
            if (depth >= 3) return [];

            return weeklyOverviewData
                .filter(p => (parentId === null ? !p.parentId : p.parentId === parentId))
                .map(p => {
                    const currentBC = breadcrumb ? `${breadcrumb} / ${p.projectName}` : p.projectName;

                    // Recursive function to get all descendant threads
                    const getAllDescendantThreads = (projId: string, currentPath: string): any[] => {
                        const direct = weeklyOverviewData.find(wp => wp.projectId === projId)?.threads || [];
                        const formattedDirect = direct.map(t => {
                            const visibleTasks = (t.tasks as Task[]).filter((task) => {
                                if (!task.done) return true;
                                if (!task.completedAt) return false;
                                const completedDateStr = new Date(task.completedAt).toISOString().split('T')[0];
                                return completedDateStr === selectedDate;
                            });
                            return {
                                id: t.id,
                                title: t.title,
                                breadcrumb: currentPath,
                                isChild: projId !== p.projectId,
                                hasPending: t.undoneTasks > 0,
                                tasks: t.tasks,
                                visibleTasks
                            };
                        });

                        const children = weeklyOverviewData.filter(wp => wp.parentId === projId);
                        const childrenThreads = children.flatMap(child =>
                            getAllDescendantThreads(child.projectId, `${currentPath} / ${child.projectName}`)
                        );

                        return [...formattedDirect, ...childrenThreads];
                    };

                    const allThreadsRaw = getAllDescendantThreads(p.projectId, p.projectName);

                    // Calculate direct threads (only those belonging to this specific project, not descendants)
                    const directThreadsRaw = (p.threads || []).map(t => {
                        const visibleTasks = (t.tasks as Task[]).filter((task) => {
                            if (!task.done) return true;
                            if (!task.completedAt) return false;
                            const completedDateStr = new Date(task.completedAt).toISOString().split('T')[0];
                            return completedDateStr === selectedDate;
                        });
                        return {
                            id: t.id,
                            title: t.title,
                            breadcrumb: p.projectName,
                            isChild: false,
                            hasPending: t.undoneTasks > 0,
                            tasks: t.tasks,
                            visibleTasks
                        };
                    });

                    // Filter out threads with NO pending tasks AND no tasks finished on selected date
                    const allThreadsWithContext = allThreadsRaw.filter(t => t.hasPending || t.visibleTasks.length > 0);
                    const directThreadsWithContext = directThreadsRaw.filter(t => t.hasPending || t.visibleTasks.length > 0);

                    // A folder is grayed out if all its (and its descendants') threads have no pending tasks
                    const isFullyCompleted = allThreadsRaw.length > 0 && allThreadsRaw.every(t => !t.hasPending);

                    return {
                        ...p,
                        breadcrumb: breadcrumb || "Root",
                        allThreadsWithContext,
                        directThreadsWithContext,
                        isFullyCompleted,
                        subfolders: buildTree(p.projectId, depth + 1, currentBC)
                    } as FolderedProject;
                })
                .filter(p => p.allThreadsWithContext.length > 0 || p.subfolders.length > 0);
        };
        return buildTree(null, 0);
    }, [weeklyOverviewData, selectedDate]);

    // Auto-expand all nodes when in tree view if nothing is expanded
    useEffect(() => {
        if (viewMode === 'tree' && expandedNodes.size === 0 && treeData.length > 0) {
            const allIds = new Set<string>();
            const collectIds = (nodes: FolderedProject[]) => {
                nodes.forEach(n => {
                    allIds.add(n.projectId);
                    collectIds(n.subfolders);
                });
            };
            collectIds(treeData);
            setExpandedNodes(allIds);
        }
    }, [viewMode, treeData, expandedNodes.size]);

    return (
        // THEMING: bg-background is the root page color from the CSS variable system.
        // text-foreground responds to both light and dark themes automatically.
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
            <ProjectSidebar
                projects={projects}
                selectedProjectId={selectedProjectId}
                onAddProject={addProject}
                onSelectProject={handleSelectProject}
                onDeleteProject={deleteProject}
                onRenameProject={renameProject}
                isSidebarVisible={isSidebarVisible}
                onToggle={() => setSidebarVisible(!isSidebarVisible)}
            />

            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* THEMING: Header uses bg-background/80 + backdrop-blur to give a translucent glass effect */}
                {/* border-border references the semantic border color which adapts to light/dark/accent */}
                <GlobalHeader
                    activeRoute="weekly"
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={handleSelectProject}
                    onAddProject={addProject}
                    onRenameProject={renameProject}
                    onDeleteProject={deleteProject}
                    showCompleted={showCompleted}
                    onToggleShowCompleted={setShowCompleted}
                    onOpenSettings={() => setSettingsModalOpen(true)}
                    taskStats={{ completed: globalCompletedTasks, total: globalTotalTasks }}
                />

                <main className="flex-1 overflow-auto custom-scrollbar">
                    <div className={`${viewMode === 'tree' ? 'w-full' : 'max-w-7xl mx-auto'} py-8 px-8`}>
                        {/* Interactive Date Selector */}
                        {/* THEMING: bg-surface for elevated container; border-border for outline */}
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
                                    {weekDates.map((day: WeekDay) => (
                                        <button
                                            key={day.date}
                                            onClick={() => setSelectedDate(day.date)}
                                            className={`flex flex-col items-center min-w-[64px] px-2.5 py-2 rounded-xl transition-all duration-300 relative group ${selectedDate === day.date
                                                ? "bg-primary text-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                                                : "text-foreground/20 hover:text-foreground/50 hover:bg-foreground/[0.02]"
                                                }`}
                                        >
                                            <span className={`text-[8px] font-bold uppercase tracking-wider mb-0.5 ${selectedDate === day.date ? 'text-foreground/80' : 'text-foreground/20 group-hover:text-foreground/40'}`}>
                                                {day.name.slice(0, 3)}
                                            </span>
                                            <span className="text-xs font-black tracking-tight">{day.day}</span>
                                            {selectedDate === day.date && (
                                                <motion.div
                                                    layoutId="activeDate"
                                                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-foreground"
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
                                    className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'table' ? "bg-foreground/[0.08] text-foreground shadow-lg" : "text-foreground/30 hover:text-foreground"}`}
                                >
                                    <LayoutDashboard className="w-3 h-3" />
                                    <span>Table</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('tree')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${viewMode === 'tree' ? "bg-foreground/[0.08] text-foreground shadow-lg" : "text-foreground/30 hover:text-foreground"}`}
                                >
                                    <Share2 className="w-3 h-3" />
                                    <span>Tree</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Canvas Content */}
                        <div className="relative">
                            {viewMode === 'table' ? (
                                /* TABLE VIEW: Horizontal rows per root project */
                                <div className="flex flex-col gap-8">
                                    {treeData.map((root) => {
                                        const allRelevantThreads = root.allThreadsWithContext;
                                        return (
                                            <motion.div
                                                key={root.projectId}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`group relative flex flex-col gap-6  rounded-3xl transition-all ${root.isFullyCompleted ? 'opacity-40 grayscale' : ''}`}
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

                                                {/* Threads Area — wraps to next line when there are many threads */}
                                                <div className="flex flex-wrap gap-4 pb-2 px-2">
                                                    {allRelevantThreads.length > 0 ? (
                                                        allRelevantThreads.map((thread: FolderedProject['allThreadsWithContext'][number]) => (
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

                                                                {/* Subtle glow on hover */}
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

                                                {/* Divider between projects */}
                                                <div className="h-px bg-gradient-to-r from-transparent via-border/10 to-transparent mt-4" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* BLUEPRINT VIEW: Hierarchical graph structure */
                                <div className="flex flex-row items-start gap-12 justify-start w-full pb-8">
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
                                                {/* Horizontal Branching Line */}
                                                {expandedNodes.has(root.projectId) && root.subfolders.length > 1 && (
                                                    <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                                )}

                                                {expandedNodes.has(root.projectId) && root.subfolders.map((child, idx) => (
                                                    <div key={child.projectId} className="flex flex-col items-center gap-12 relative">
                                                        {/* Vertical connector from branch */}
                                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-[2px] h-12 bg-gradient-to-b from-primary/30 to-transparent blur-[0.5px]" />
                                                        {idx === Math.floor(root.subfolders.length / 2) && (
                                                            /* Main stem from parent above */
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
                                                                    {/* Organic connector to grandchild */}
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
                </main>
            </div >

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
            />

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--color-border) / 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--color-primary) / 0.3);
                }
            `}</style>
        </div >
    );
};

export default WeeklyRoadmap;
