"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Lightbulb, Compass } from "lucide-react";
import ProjectNavigator from "./ProjectNavigator";
import HeaderActions from "./HeaderActions";
import { Project } from "../types";

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
                                <h1 className="text-2xl font-serif font-bold text-text-primary leading-tight">
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

                            <nav className="flex items-center gap-1.5 p-1 bg-background/50 rounded-xl border border-border/10">
                                <Link
                                    href="/"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRoute === 'explorer'
                                        ? "bg-surface text-primary shadow-sm border border-border/50"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                                        }`}
                                >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Explorer</span>
                                </Link>
                                <Link
                                    href="/lucid"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRoute === 'lucid'
                                        ? "bg-surface text-primary shadow-sm border border-border/50"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                                        }`}
                                >
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Lucid</span>
                                </Link>
                                <Link
                                    href="/weekly"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeRoute === 'weekly'
                                        ? "bg-surface text-primary shadow-sm border border-border/50"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
                                        }`}
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Roadmap</span>
                                </Link>
                            </nav>
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
