"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Plus, Folder, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Project } from "../types";

interface ProjectNavigatorProps {
    projects: Record<string, Project>;
    selectedProjectId: string | null;
    onSelectProject: (projectId: string) => void;
    onAddProject: (name: string, parentId: string | null) => void;
}

const ProjectNavigator: React.FC<ProjectNavigatorProps> = ({
    projects,
    selectedProjectId,
    onSelectProject,
    onAddProject,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedProject = selectedProjectId ? projects[selectedProjectId] : null;

    // Flatten projects and filter based on search
    const filteredProjects = useMemo(() => {
        const list = Object.values(projects);
        if (!searchQuery.trim()) return list;
        return list.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [projects, searchQuery]);

    // Determine if we should show characters for "Create new"
    const canCreate = searchQuery.trim() && !filteredProjects.some(p => p.name.toLowerCase() === searchQuery.trim().toLowerCase());

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSelectedIndex(0);
        } else {
            setSearchQuery("");
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
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % (filteredProjects.length + (canCreate ? 1 : 0)));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + (filteredProjects.length + (canCreate ? 1 : 0))) % (filteredProjects.length + (canCreate ? 1 : 0)));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (canCreate && selectedIndex === filteredProjects.length) {
                onAddProject(searchQuery.trim(), null);
                setIsOpen(false);
            } else if (filteredProjects[selectedIndex]) {
                onSelectProject(filteredProjects[selectedIndex].id);
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-border/40 transition-colors group cursor-pointer"
            >
                <div className="w-5 h-5 flex items-center justify-center text-primary">
                    <Folder className="w-4 h-4" />
                </div>
                <span className="text-base font-semibold text-text-primary truncate max-w-[200px]">
                    {selectedProject?.name || "Select Project"}
                </span>
                <ChevronDown className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden"
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

                        <div className="max-h-64 overflow-y-auto p-1">
                            {filteredProjects.map((project, index) => (
                                <button
                                    key={project.id}
                                    onClick={() => {
                                        onSelectProject(project.id);
                                        setIsOpen(false);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${selectedIndex === index
                                            ? "bg-primary/10 text-primary"
                                            : "text-text-primary hover:bg-background"
                                        }`}
                                >
                                    <Folder className={`w-4 h-4 ${selectedIndex === index ? "text-primary" : "text-text-secondary"}`} />
                                    <span className="flex-1 truncate">{project.name}</span>
                                    {selectedProjectId === project.id && (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </button>
                            ))}

                            {canCreate && (
                                <button
                                    onClick={() => {
                                        onAddProject(searchQuery.trim(), null);
                                        setIsOpen(false);
                                    }}
                                    onMouseEnter={() => setSelectedIndex(filteredProjects.length)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${selectedIndex === filteredProjects.length
                                            ? "bg-primary/10 text-primary"
                                            : "text-text-primary hover:bg-background"
                                        }`}
                                >
                                    <Plus className="w-4 h-4 text-primary" />
                                    <span className="flex-1 truncate">Create "{searchQuery.trim()}"</span>
                                </button>
                            )}

                            {filteredProjects.length === 0 && !canCreate && (
                                <div className="px-3 py-8 text-center">
                                    <p className="text-xs text-text-secondary">No projects found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectNavigator;
