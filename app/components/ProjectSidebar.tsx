/**
 * =================================================================================================
 * CONTEXT ANCHOR: ProjectSidebar Component (ProjectSidebar.tsx)
 * =================================================================================================
 *
 * @purpose
 * Renders the primary navigation sidebar for projects. It provides a hierarchical, modern UI
 * for users to organize, navigate, and manage their workspaces.
 *
 * @dependencies
 * - REACT: `useState` for internal UI state management.
 * - FRAMER-MOTION: For animations, particularly for the collapsible UI.
 * - LUCIDE-REACT: For modern and consistent iconography.
 * - COMPONENT: `ProjectItem` (this file): The recursive component used to render each item in the tree.
 * - TYPES: `Project` from `../types`.
 *
 * @invariants
 * 1. HIERARCHY: The component correctly renders a nested tree structure based on the `parentId`
 *    relations in the flat `projects` data record.
 * 2. CONTROLLED COMPONENT: All core data operations (add, rename, delete) and its visibility state
 *    are delegated to the parent component via callbacks (`onAddProject`, `onToggle`, etc.).
 *
 * @state_management
 * - It receives its visibility state (`isSidebarVisible`) and a toggle handler (`onToggle`) as props
 *   from its parent, making it a controlled component regarding its collapsed/expanded state.
 * - It manages its own internal UI state for the "Add New Root Project" input form (`showInput`).
 *
 * @ai_note
 * This file contains two components: `ProjectSidebar` (the main container) and `ProjectItem`
 * (the recursive unit). The sidebar's visibility is controlled by the parent `page.tsx` component.
 * The toggle button is now part of this component, absolutely positioned to "peek" out from the
 * side, providing a clear UX affordance for collapsing and expanding the sidebar.
 * =================================================================================================
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Folder,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  X,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Project, ProjectBaseProps } from "../types";

interface ProjectSidebarProps extends ProjectBaseProps {
  isSidebarVisible: boolean;
  onToggle: () => void;
}

/**
 * =================================================================================================
 * CONTEXT ANCHOR: ProjectItem Sub-Component
 * =================================================================================================
 *
 * @purpose
 * Renders a single, potentially recursive, project item within the sidebar. It is responsible
 * for displaying the project's name, hierarchy level, and handling all user interactions for
 * that specific item, such as selection, expansion, renaming, and deletion.
 *
 * @dependencies
 * - REACT: `useState` for its own internal UI state.
 * - LUCIDE-REACT: For icons.
 *
 * @invariants
 * 1. RECURSIVE RENDERING: It renders a `ProjectItem` for each of its children, passing an
 *    incremented `level` prop to maintain the visual hierarchy.
 * 2. STATE DELEGATION: Like its parent, it delegates all data-mutating actions to the top-level
 *    component via props.
 *
 * @state_management
 * - Manages its own UI state, such as `isExpanded`, `isAdding`, `isRenaming`, and `showMenu`,
 *   to control the display of its children, input fields, and context menus. This localizes
 *   UI logic and prevents unnecessary re-renders of the entire tree.
 *
 * @ai_note
 * This is a dense component. Key logic to focus on:
 * - The return statement has two main branches: one for the `isCollapsed` view (icon-only) and
 *   one for the expanded view.
 * - The expanded view uses inline `isRenaming` and `isAdding` state to render input fields
 *   directly within the project list for a seamless editing experience.
 * - The 3-dot context menu (`MoreVertical`) is conditionally rendered on hover and manages its
 *   own `showMenu` state.
 * =================================================================================================
 */
const ProjectItem: React.FC<ProjectBaseProps & {
  project: Project;
  level: number;
  isCollapsed: boolean;
}> = ({
  project,
  projects,
  level,
  onSelectProject,
  selectedProjectId,
  onAddProject,
  onRenameProject,
  onDeleteProject,
  isCollapsed,
}) => {
    const children = Object.values(projects).filter(
      (p) => p.parentId === project.id
    );
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isHovered, setIsHovered] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(project.name);

    const isSelected = selectedProjectId === project.id;
    const hasChildren = children.length > 0;

    const handleAddNestedProject = () => {
      if (newProjectName.trim()) {
        onAddProject(newProjectName.trim(), project.id);
        setNewProjectName("");
        setIsAdding(false);
        setIsExpanded(true);
      }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleAddNestedProject();
      } else if (e.key === "Escape") {
        setIsAdding(false);
        setNewProjectName("");
      }
    };

    // STRATEGY: Finalizes the rename operation. It triggers the parent callback `onRenameProject`
    // only if the name has actually changed and is not empty. This prevents unnecessary state updates.
    // It then resets the local renaming UI state.
    const handleRename = () => {
      if (renameValue.trim() && renameValue !== project.name && onRenameProject) {
        onRenameProject(project.id, renameValue.trim());
      }
      setIsRenaming(false);
      setShowMenu(false);
    };

    // STRATEGY: Handles the delete action with user confirmation.
    // A native `window.confirm` dialog is used to prevent accidental deletion, clearly stating
    // the consequences (deleting sub-projects). The actual deletion logic is deferred to the parent
    // component via the `onDeleteProject` callback.
    const handleDelete = () => {
      // CONSTRAINT: Always confirm destructive actions with the user.
      if (
        onDeleteProject &&
        window.confirm(
          `Are you sure you want to delete "${project.name}" and all its sub-projects? This action cannot be undone.`
        )
      ) {
        onDeleteProject(project.id);
      }
      setShowMenu(false);
    };

    const handleRenameKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleRename();
      } else if (e.key === "Escape") {
        setIsRenaming(false);
        setRenameValue(project.name);
      }
    };

    // STRATEGY: Renders a minimal, icon-only representation of the project item
    // when the sidebar is in its collapsed state.
    if (isCollapsed) {
      return (
        <div className="mb-1">
          <button
            onClick={() => onSelectProject(project.id)}
            className={`w-full p-2.5 rounded-lg transition-all group relative ${isSelected
              ? "bg-primary-light text-primary-text ring-1 ring-primary/20"
              : "hover:bg-background text-text-secondary"
              }`}
            title={project.name}
          >
            {isSelected ? (
              <FolderOpen className="w-5 h-5 mx-auto" />
            ) : (
              <Folder className="w-5 h-5 mx-auto" />
            )}
            {/* STRATEGY: A small dot indicates that a project has children, even in collapsed view. */}
            {hasChildren && !isSelected && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
            )}
          </button>
        </div>
      );
    }

    // STRATEGY: Renders the full, expanded view of the project item, including indentation,
    // action buttons, and nested children.
    const indentPx = level * 20;

    return (
      <div className="mb-0.5">
        <div
          className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${isSelected
            ? "bg-primary-light text-primary-text ring-1 ring-primary/20"
            : "hover:bg-background text-text-primary"
            }`}
          style={{ paddingLeft: `${indentPx + 8}px` }}
          onClick={() => onSelectProject(project.id)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Expand/Collapse Chevron */}
          {/* STRATEGY: This chevron is only visible if the item has children or if the user is currently adding a new child to it. */}
          {hasChildren || isAdding ? (
            <button
              onClick={(e) => {
                e.stopPropagation(); // CONSTRAINT: Prevent the click from also selecting the project.
                setIsExpanded(!isExpanded);
              }}
              className={`shrink-0 p-0.5 rounded transition-colors ${isSelected
                ? "text-primary-text"
                : "text-text-secondary hover:text-text-primary"
                }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // STRATEGY: Render a placeholder to maintain alignment for items without children.
          )}

          {/* Folder Icon */}
          <div
            className={`shrink-0 transition-transform ${isHovered && !isSelected ? "scale-110" : ""
              }`}
          >
            {isSelected ? (
              <FolderOpen className="w-5 h-5 text-primary" />
            ) : (
              <Folder
                className={`w-5 h-5 ${hasChildren ? "text-primary" : "text-text-secondary"
                  }`}
              />
            )}
          </div>

          {/* Project Name or Rename Input */}
          {/* STRATEGY: Conditionally render a text input for inline renaming when `isRenaming` is true. */}
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleRenameKeyPress}
              onBlur={handleRename}
              className="flex-1 px-2 py-1 text-[15px] font-medium bg-surface border border-primary/30 rounded focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
              onClick={(e) => e.stopPropagation()} // CONSTRAINT: Prevent clicks on the input from selecting the project.
            />
          ) : (
            <span
              className={`flex-1 truncate text-[15px] font-medium ${isSelected ? "text-primary-text" : "text-text-primary"
                }`}
            >
              {project.name}
            </span>
          )}

          {/* Child Count Badge */}
          {hasChildren && !isRenaming && (
            <span
              className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full ${isSelected
                ? "bg-primary-light text-primary-text"
                : "bg-background text-text-secondary"
                }`}
            >
              {children.length}
            </span>
          )}

          {/* Action Buttons (Menu and Add) */}
          {/* STRATEGY: Action buttons are hidden by default and appear on hover to keep the UI clean. */}
          {!isRenaming && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className={`shrink-0 p-1.5 rounded-md transition-all ${showMenu
                  ? "bg-border text-text-primary"
                  : isSelected
                    ? "hover:bg-primary-light text-primary opacity-0 group-hover:opacity-100"
                    : "hover:bg-background text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100"
                  }`}
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {/* STRATEGY: The dropdown menu is rendered in a portal-like fashion using a fixed-position backdrop to catch outside clicks. */}
              {showMenu && (
                <>
                  {/* Backdrop to close menu on outside click */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />

                  {/* Menu Content */}
                  <div className="absolute right-0 top-full mt-1 w-40 bg-surface rounded-lg shadow-lg border border-border py-1 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameValue(project.name);
                        setIsRenaming(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-background flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {!isRenaming && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAdding(true);
                setIsExpanded(true);
              }}
              className={`shrink-0 p-1.5 rounded-md transition-all ${isSelected
                ? "hover:bg-primary-light text-primary opacity-0 group-hover:opacity-100"
                : "hover:bg-background text-text-secondary hover:text-primary opacity-0 group-hover:opacity-100"
                }`}
              title="Add nested project"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recursive Rendering of Children */}
        {/* STRATEGY: If the item is expanded, recursively render its children and show the inline 'add' form if active. */}
        {isExpanded && (
          <div className="mt-0.5">
            {children.map((child) => (
              <ProjectItem
                key={child.id}
                project={child}
                projects={projects}
                level={level + 1}
                onSelectProject={onSelectProject}
                selectedProjectId={selectedProjectId}
                onAddProject={onAddProject}
                onRenameProject={onRenameProject}
                onDeleteProject={onDeleteProject}
                isCollapsed={isCollapsed}
              />
            ))}

            {/* Inline Add Form */}
            {isAdding && (
              <div
                className="mt-1 mb-2 flex items-center gap-2 px-2 py-2"
                style={{ paddingLeft: `${indentPx + 28}px` }}
              >
                <Folder className="w-4 h-4 text-text-secondary shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Project name..."
                  className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={handleAddNestedProject}
                  className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded text-xs font-medium shrink-0 hover:bg-primary-hover transition-colors"
                  title="Add"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewProjectName("");
                  }}
                  className="p-1.5 bg-border text-text-secondary rounded-lg hover:bg-surface transition-colors"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  projects,
  onSelectProject,
  onAddProject,
  onRenameProject,
  onDeleteProject,
  selectedProjectId,
  isSidebarVisible,
  onToggle,
}) => {
  const [newProjectName, setNewProjectName] = useState("");
  const isCollapsed = !isSidebarVisible;
  const [showInput, setShowInput] = useState(false);

  // STRATEGY: Filter for root projects (those without a parent) to start the tree rendering.
  const rootProjects = Object.values(projects).filter(
    (p) => p.parentId === null
  );

  const handleAddNewRootProject = () => {
    const trimmedName = newProjectName.trim();
    if (trimmedName) {
      onAddProject(trimmedName, null);
      setNewProjectName("");
      setShowInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddNewRootProject();
    } else if (e.key === "Escape") {
      setShowInput(false);
      setNewProjectName("");
    }
  };

  return (
    <div
      className={`relative bg-surface flex flex-col h-screen shrink-0 transition-all duration-300 shadow-lg ${isCollapsed ? "w-0 border-none" : "w-80 border-r border-border"
        }`}
    >
      {/* STRATEGY: This toggle button is absolutely positioned to "peek" out from the edge of the sidebar.
          This provides a clear, intuitive UX for collapsing/expanding the panel, directly attached to the
          element it controls. It's animated with Framer Motion for better discoverability. */}
      <motion.button
        onClick={onToggle}
        className="absolute top-1/2 -translate-y-1/2 z-10 bg-surface border border-border rounded-full p-2 shadow-lg"
        style={{ right: "-22px" }}
        initial={{ scale: 0, x: -20 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-slate-700" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-text-secondary" />
        )}
      </motion.button>
      <div className="h-full w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className={`px-4 py-4 border-b border-border flex items-center gap-3`}
        >
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center shadow-sm">
                <Folder className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Projects</h2>
                <p className="text-[11px] text-text-secondary">
                  {rootProjects.length} workspace
                  {rootProjects.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Project List */}
        <div className="flex-1 p-3 overflow-y-auto">
          {rootProjects.length > 0 ? (
            <div className="space-y-0.5">
              {rootProjects.map((project) => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  projects={projects}
                  level={0}
                  onSelectProject={onSelectProject}
                  selectedProjectId={selectedProjectId}
                  onAddProject={onAddProject}
                  onRenameProject={onRenameProject}
                  onDeleteProject={onDeleteProject}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          ) : (
            // STRATEGY: Show a helpful empty state message when there are no projects,
            // but only if the sidebar is not collapsed.
            !isCollapsed && (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-linear-to-br from-background to-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-8 h-8 text-text-secondary" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">
                  No projects yet
                </h3>
                <p className="text-xs text-text-secondary mb-4">
                  Create your first project to get started
                </p>
                <button
                  onClick={() => setShowInput(true)}
                  className="text-xs text-primary hover:text-primary-hover font-medium"
                >
                  Create project →
                </button>
              </div>
            )
          )}
        </div>

        {/* Add New Root Project Form */}
        {/* CONSTRAINT: The form for adding a new root project is not available when the sidebar is collapsed. */}
        {!isCollapsed && (
          <div className="p-3 border-t border-border bg-background">
            {/* STRATEGY: Conditionally show the input form or the "New Project" button based on `showInput` state. */}
            {showInput ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-text-secondary shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="New project name..."
                    className="flex-1 px-3 py-2 text-sm bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddNewRootProject}
                    className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded text-xs font-medium shrink-0 hover:bg-primary-hover transition-colors"
                  >
                    Create Project
                  </button>
                  <button
                    onClick={() => {
                      setShowInput(false);
                      setNewProjectName("");
                    }}
                    className="px-4 py-2 bg-background text-text-secondary text-sm font-medium rounded-lg hover:bg-border transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowInput(true)}
                className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded text-xs font-medium shrink-0 hover:bg-primary-hover transition-colors w-full justify-center"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectSidebar;
