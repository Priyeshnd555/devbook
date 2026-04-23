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
        <header className="bg-surface border-b border-border z-20 sticky top-0">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex flex-col hover:opacity-80 transition-opacity">
                                <h1 className="text-xl font-sans font-medium text-text-primary tracking-tight leading-tight">
                                    Thread Notes
                                </h1>
                                {taskStats && (
                                    <p className="text-[9px] text-text-secondary font-medium uppercase tracking-[0.1em] mt-0.5">
                                        {taskStats.completed}/{taskStats.total}
                                    </p>
                                )}
                            </Link>
                        </div>

                        <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />

                        <div className="flex items-center gap-4">
                            <ProjectNavigator
                                projects={projects}
                                selectedProjectId={selectedProjectId}
                                onSelectProject={onSelectProject}
                                onAddProject={onAddProject}
                                onRenameProject={onRenameProject}
                                onDeleteProject={onDeleteProject}
                            />

                            <nav className="flex items-center gap-1 p-0.5 bg-background/30 rounded-lg">
                                <Link
                                    href="/weekly"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-medium uppercase tracking-widest transition-all ${activeRoute === 'weekly'
                                        ? "text-primary border-b border-primary"
                                        : "text-text-secondary hover:text-text-primary"
                                        }`}
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Roadmap</span>
                                </Link>
                                <Link
                                    href="/"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-medium uppercase tracking-widest transition-all ${activeRoute === 'explorer'
                                        ? "text-primary border-b border-primary"
                                        : "text-text-secondary hover:text-text-primary"
                                        }`}
                                >
                                    <Compass className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Explorer</span>
                                </Link>
                                <Link
                                    href="/lucid"
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-medium uppercase tracking-widest transition-all ${activeRoute === 'lucid'
                                        ? "text-primary border-b border-primary"
                                        : "text-text-secondary hover:text-text-primary"
                                        }`}
                                >
                                    <Lightbulb className="w-3.5 h-3.5" />
                                    <span className="hidden lg:inline">Lucid</span>
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
