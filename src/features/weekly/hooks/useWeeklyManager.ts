"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Task } from "@shared/types";
import { getWeekDates } from "@shared/utils";
import { FolderedProject, WeeklyOverviewItem } from "../types";

export const useWeeklyManager = (
    weeklyOverviewData: WeeklyOverviewItem[], 
    handleSelectProject: (id: string) => void, 
    handleSelectThread: (id: string) => void
) => {
    const router = useRouter();
    const [weekOffset, setWeekOffset] = useState(0);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

    const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
    const todayStr = new Date().toISOString().split("T")[0];

    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const initialDates = getWeekDates(0);
        return initialDates.find(d => d.date === todayStr)?.date || initialDates[0]?.date || "";
    });

    const effectiveSelectedDate = useMemo(() => {
        if (weekDates.some(d => d.date === selectedDate)) {
            return selectedDate;
        }
        return weekDates.find(d => d.date === todayStr)?.date || weekDates[0]?.date || "";
    }, [weekDates, selectedDate, todayStr]);

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

    const handleThreadClick = (projectId: string, threadId: string) => {
        handleSelectProject(projectId);
        handleSelectThread(threadId);
        router.push('/');
    };

    const treeData: FolderedProject[] = useMemo(() => {
        const buildTree = (parentId: string | null, depth: number, breadcrumb: string = ""): FolderedProject[] => {
            if (depth >= 3) return [];

            return weeklyOverviewData
                .filter(p => (parentId === null ? !p.parentId : p.parentId === parentId))
                .map(p => {
                    const currentBC = breadcrumb ? `${breadcrumb} / ${p.projectName}` : p.projectName;

                    const getAllDescendantThreads = (projId: string, currentPath: string): FolderedProject["allThreadsWithContext"] => {
                        const direct = weeklyOverviewData.find(wp => wp.projectId === projId)?.threads || [];
                        const formattedDirect = direct.map(t => {
                            const visibleTasks = t.tasks.filter((task: Task) => {
                                if (!task.done) return true;
                                if (!task.completedAt) return false;
                                const completedDateStr = new Date(task.completedAt).toISOString().split('T')[0];
                                return completedDateStr === effectiveSelectedDate;
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

                    const directThreadsRaw = (p.threads || []).map(t => {
                        const visibleTasks = t.tasks.filter((task: Task) => {
                            if (!task.done) return true;
                            if (!task.completedAt) return false;
                            const completedDateStr = new Date(task.completedAt).toISOString().split('T')[0];
                            return completedDateStr === effectiveSelectedDate;
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

                    const allThreadsWithContext = allThreadsRaw.filter(t => t.hasPending || t.visibleTasks.length > 0);
                    const directThreadsWithContext = directThreadsRaw.filter(t => t.hasPending || t.visibleTasks.length > 0);
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
    }, [weeklyOverviewData, effectiveSelectedDate]);

    const handleSetViewMode = (mode: 'table' | 'tree') => {
        setViewMode(mode);
        if (mode === 'tree' && expandedNodes.size === 0 && treeData.length > 0) {
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
    };

    return {
        weekOffset,
        setWeekOffset,
        expandedNodes,
        setExpandedNodes,
        viewMode,
        setViewMode: handleSetViewMode,
        selectedDate: effectiveSelectedDate,
        setSelectedDate,
        weekDates,
        todayStr,
        toggleNodeExpand,
        handleThreadClick,
        treeData
    };
};
