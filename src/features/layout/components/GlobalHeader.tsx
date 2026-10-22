"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Lightbulb, ListTodo, List, LayoutGrid } from "lucide-react";
import { ProjectNavigator } from "@features/projects";
import HeaderActions from "./HeaderActions";
import { Project } from "@shared/types";

interface GlobalHeaderProps {
    activeRoute: 'explorer' | 'lucid' | 'weekly';
    projects: Record<string, Project>;
    selectedProjectId: string | null;
    onSelectProject: (id: string) => void;
    onAddProject: (name: string, parentId: string | null) => void;
    onRenameProject: (id: string, newName: string) => void;
    onDeleteProject: (id: string) => void;
    showCompleted: boolean;
    onToggleShowCompleted: (value: boolean) => void;
    onOpenSettings: () => void;
    viewMode?: 'list' | 'canvas';
    onViewModeChange?: (mode: 'list' | 'canvas') => void;
    primaryAction?: React.ReactNode;
    secondaryActions?: React.ReactNode;
    taskStats?: {
        completed: number;
        total: number;
    };
}

const GlobalHeader: React.FC<GlobalHeaderProps> = ({
    activeRoute,
    projects,
    selectedProjectId,
    onSelectProject,
    onAddProject,
    onRenameProject,
    onDeleteProject,
    showCompleted,
    onToggleShowCompleted,
    onOpenSettings,
    viewMode,
    onViewModeChange,
    primaryAction,
    secondaryActions,
    taskStats,
}) => {
    return (
        <header className="bg-surface border-b border-border shadow-xs z-20 sticky top-0">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex flex-col hover:opacity-80 transition-opacity">
                                <h1 className="text-2xl font-sans font-bold text-text-primary leading-tight">
                                    Thread Notes
                                </h1>
                                {taskStats && (
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5">
                                        {taskStats.completed}/{taskStats.total} Tasks
                                    </p>
                                )}
                            </Link>
                        </div>

                        <div className="h-10 w-[1px] bg-border mx-1 hidden md:block" />

                        <div className="flex items-center gap-4">
                            <ProjectNavigator
                                projects={projects}
                                selectedProjectId={selectedProjectId}
                                onSelectProject={onSelectProject}
                                onAddProject={onAddProject}
                                onRenameProject={onRenameProject}
                                onDeleteProject={onDeleteProject}
                            />

                            <nav className="flex items-center gap-1.5 p-1 bg-background/50 rounded-xl border border-border/40 shadow-xs">
                                <Link
                                    href="/weekly"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRoute === 'weekly'
                                        ? "bg-surface text-primary shadow-sm border border-border/50"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                                        }`}
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    <span>Roadmap</span>
                                </Link>
                                <Link
                                    href="/"
                                    onClick={(e) => {
                                        if (activeRoute !== 'weekly' && onViewModeChange && viewMode !== 'list') {
                                            e.preventDefault();
                                            onViewModeChange('list');
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRoute !== 'weekly'
                                        ? "bg-surface text-primary shadow-sm border border-border/50"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                                        }`}
                                >
                                    <ListTodo className="w-3.5 h-3.5" />
                                    <span>Tasks</span>
                                </Link>
                            </nav>

                            {/* View Switcher: List or All Cards */}
                            {activeRoute !== 'weekly' && onViewModeChange && (
                                <div className="flex items-center p-0.5 bg-background border border-border rounded-lg shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => onViewModeChange('list')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                            viewMode === 'list'
                                                ? "bg-surface text-primary font-bold shadow-xs border border-border/40"
                                                : "text-text-secondary hover:text-text-primary"
                                        }`}
                                        title="List view"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">List</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onViewModeChange('canvas')}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                            viewMode === 'canvas'
                                                ? "bg-surface text-primary font-bold shadow-xs border border-border/40"
                                                : "text-text-secondary hover:text-text-primary"
                                        }`}
                                        title="All tasks at once (Canvas view)"
                                    >
                                        <LayoutGrid className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">All Tasks</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {secondaryActions && (
                            <div className="flex items-center gap-2 mr-1">
                                {secondaryActions}
                            </div>
                        )}

                        {primaryAction}

                        <HeaderActions
                            showCompleted={showCompleted}
                            onToggleShowCompleted={onToggleShowCompleted}
                            onOpenSettings={onOpenSettings}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default GlobalHeader;
