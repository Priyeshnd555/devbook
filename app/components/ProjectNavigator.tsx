"use client";

/**
 * AI CONTEXT: Project Navigator Module
 * PURPOSE: Provides a hierarchical, searchable tree view for managing and selecting projects/folders.
 * KEY DEPENDENCIES: lucide-react (icons), framer-motion (animations), ../types (Project model)
 * CRITICAL FUNCTIONS: ProjectNavigator (root), NavigatorItem (recursive node)
 * STATE MUTATIONS: Nested folder creation, inline renaming, folder deletion via callbacks.
 * 
 * GENERATION 1: Flat list with simple search.
 * GENERATION 2: Hierarchical tree view with Slack-like connectors and breadcrumb trigger.
 * GENERATION 3: Added Rename/Delete support with improved event propagation stability.
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Plus, Folder, ChevronDown, Check, X, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project, ProjectBaseProps } from "../types";

type ProjectNavigatorProps = ProjectBaseProps;

/**
 * CONTEXT ANCHOR: NavigatorItem
 * PURPOSE: Renders an individual project node in the tree with support for nesting, renaming, and management.
 * DEPENDENCIES: Folder icons, MoreVertical menu, onRenameProject, onDeleteProject, onAddProject.
 * INVARIANTS: Children always inherit parentId; only one management mode (adding/renaming) is active per item.
 */
const NavigatorItem: React.FC<ProjectBaseProps & {
    project: Project;
    level: number;
    searchQuery: string;
    onClose: () => void;
}> = ({
    project,
    projects,
    level,
    onSelectProject,
    onAddProject,
    onRenameProject,
    onDeleteProject,
    searchQuery,
    selectedProjectId,
    onClose,
}) => {
        const [isAdding, setIsAdding] = useState(false);
        const [isRenaming, setIsRenaming] = useState(false);
        const [showMenu, setShowMenu] = useState(false);
        const [newProjectName, setNewProjectName] = useState("");
        const [renameValue, setRenameValue] = useState(project.name);
        const children = Object.values(projects).filter((p) => p.parentId === project.id);
        const isSelected = selectedProjectId === project.id;

        const matchesSearch = !searchQuery || project.name.toLowerCase().includes(searchQuery.toLowerCase());
        const hasMatchingChildren = children.some(child =>
            child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Object.values(projects).some(p => p.parentId === child.id && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        if (!matchesSearch && !hasMatchingChildren && searchQuery) return null;

        const handleAdd = () => {
            if (newProjectName.trim()) {
                onAddProject(newProjectName.trim(), project.id);
                setNewProjectName("");
                setIsAdding(false);
            }
        };

        const handleRename = () => {
            if (renameValue.trim() && renameValue !== project.name) {
                onRenameProject(project.id, renameValue.trim());
            }
            setIsRenaming(false);
            setShowMenu(false);
        };

        // STRATEGY: Confirm destructive actions via window.confirm to prevent accidental data loss.
        // CONSTRAINT: setShowMenu(false) must happen regardless of confirmation to clean up UI.
        const handleDelete = () => {
            if (window.confirm(`Are you sure you want to delete "${project.name}" and all its sub-projects? This action cannot be undone.`)) {
                onDeleteProject(project.id);
            }
            setShowMenu(false);
        };

        return (
            <>
                <div
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer relative ${isSelected ? "bg-primary/10 text-primary" : "text-text-primary hover:bg-background"
                        }`}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                    onClick={() => {
                        onSelectProject(project.id);
                        onClose();
                    }}
                >
                    {/* Visual Connector for nesting */}
                    {level > 0 && (
                        <div
                            className="absolute left-[16px] top-0 bottom-0 w-[1px] bg-border/40"
                            style={{ left: `${(level - 1) * 16 + 20}px` }}
                        />
                    )}

                    <Folder className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary" : "text-text-secondary"}`} />

                    {isRenaming ? (
                        <input
                            autoFocus
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                                if (e.key === "Escape") setIsRenaming(false);
                            }}
                            onBlur={handleRename}
                            className="flex-1 min-w-0 bg-surface border border-primary/30 rounded px-1 text-sm focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="flex-1 truncate font-medium">{project.name}</span>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsAdding(true);
                            }}
                            className="p-1 hover:bg-border rounded text-text-secondary hover:text-primary transition-all"
                            title="Add sub-folder"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>

                        <div className="relative">
                            <button
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-1 hover:bg-border rounded text-text-secondary hover:text-text-primary transition-all"
                                title="More options"
                            >
                                <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowMenu(false);
                                        }}
                                    />
                                    <div className="absolute right-0 top-full mt-1 w-32 bg-surface border border-border rounded-lg shadow-lg py-1 z-20">
                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsRenaming(true);
                                                setShowMenu(false);
                                            }}
                                            className="w-full px-3 py-1.5 text-left text-xs text-text-primary hover:bg-background flex items-center gap-2"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            Rename
                                        </button>
                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete();
                                            }}
                                            className="w-full px-3 py-1.5 text-left text-xs text-danger hover:bg-danger/10 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {isSelected && !isRenaming && <Check className="w-4 h-4 text-primary shrink-0" />}
                </div>

                {isAdding && (
                    <div
                        className="flex items-center gap-2 px-3 py-1.5"
                        style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
                    >
                        <Folder className="w-4 h-4 text-text-secondary shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAdd();
                                if (e.key === "Escape") setIsAdding(false);
                            }}
                            placeholder="Sub-folder name..."
                            className="flex-1 min-w-0 bg-transparent border-none text-sm focus:outline-none text-text-primary"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                            className="text-primary hover:text-primary-hover"
                            title="Confirm"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setIsAdding(false); }}
                            className="text-text-secondary hover:text-text-primary"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {children.length > 0 && (
                    <div className="mt-0.5">
                        {children.map((child) => (
                            <NavigatorItem
                                key={child.id}
                                project={child}
                                projects={projects}
                                level={level + 1}
                                onSelectProject={onSelectProject}
                                onAddProject={onAddProject}
                                onRenameProject={onRenameProject}
                                onDeleteProject={onDeleteProject}
                                searchQuery={searchQuery}
                                selectedProjectId={selectedProjectId}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                )}
            </>
        );
    };

/**
 * CONTEXT ANCHOR: ProjectNavigator
 * PURPOSE: Main trigger button and popover container for the hierarchical project tree.
 * DEPENDENCIES: useWorkflowManager callbacks (passed from parent), Framer Motion.
 * INVARIANTS: Popover always renders as an absolute child of the trigger wrapper.
 */
const ProjectNavigator: React.FC<ProjectNavigatorProps> = ({
    projects,
    selectedProjectId,
    onSelectProject,
    onAddProject,
    onRenameProject,
    onDeleteProject,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedProject = selectedProjectId ? projects[selectedProjectId] : null;

    // Breadcrumbs for the trigger button
    const breadcrumbs = useMemo(() => {
        if (!selectedProject) return [];
        const path: Project[] = [];
        let curr: Project | undefined = selectedProject;
        while (curr) {
            path.unshift(curr);
            curr = curr.parentId ? projects[curr.parentId] : undefined;
        }
        return path;
    }, [selectedProject, projects]);

    const rootProjects = useMemo(() =>
        Object.values(projects).filter(p => !p.parentId),
        [projects]
    );

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && searchQuery.trim()) {
            const match = Object.values(projects).find(p => p.name.toLowerCase() === searchQuery.trim().toLowerCase());
            if (match) {
                onSelectProject(match.id);
                setIsOpen(false);
            } else {
                onAddProject(searchQuery.trim(), null);
                setSearchQuery("");
                setIsOpen(false);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-border/40 transition-colors group cursor-pointer"
            >
                <div className="w-5 h-5 flex items-center justify-center text-primary shrink-0">
                    <Folder className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1 text-sm font-medium text-text-secondary overflow-hidden">
                    {breadcrumbs.map((p, idx) => (
                        <React.Fragment key={p.id}>
                            <span className={`truncate max-w-[120px] ${idx === breadcrumbs.length - 1 ? "text-text-primary font-bold" : "opacity-60"}`}>
                                {p.name}
                            </span>
                            {idx < breadcrumbs.length - 1 && <span className="opacity-30">/</span>}
                        </React.Fragment>
                    ))}
                    {breadcrumbs.length === 0 && <span className="text-text-primary font-bold">Select Project</span>}
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl z-50"
                    >
                        <div className="p-2 border-b border-border bg-background/50">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search projects..."
                                    className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <div className="max-h-80 overflow-y-auto p-1 custom-scrollbar">
                            {rootProjects.map((project) => (
                                <NavigatorItem
                                    key={project.id}
                                    project={project}
                                    projects={projects}
                                    level={0}
                                    onSelectProject={onSelectProject}
                                    onAddProject={onAddProject}
                                    onRenameProject={onRenameProject}
                                    onDeleteProject={onDeleteProject}
                                    searchQuery={searchQuery}
                                    selectedProjectId={selectedProjectId}
                                    onClose={() => setIsOpen(false)}
                                />
                            ))}

                            {searchQuery.trim() && !Object.values(projects).some(p => p.name.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                                <button
                                    onClick={() => {
                                        onAddProject(searchQuery.trim(), null);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/5 transition-colors text-left"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="flex-1 truncate">Create root &quot;{searchQuery.trim()}&quot;</span>
                                </button>
                            )}

                            {rootProjects.length === 0 && (
                                <div className="px-3 py-8 text-center">
                                    <p className="text-xs text-text-secondary">No projects found</p>
                                </div>
                            )}
                        </div>

                        <div className="p-2 border-t border-border bg-background/30 flex justify-between items-center text-[10px] text-text-secondary uppercase tracking-widest font-bold px-4">
                            <span>Hierarchy Mode</span>
                            <span className="opacity-50">ESC to close</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectNavigator;
