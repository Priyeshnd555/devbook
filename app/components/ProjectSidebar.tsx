/**
 * CONTEXT ANCHOR: ProjectSidebar Component
 *
 * PURPOSE:
 * Provides a hierarchical navigation sidebar for projects, designed with a polished, modern UI.
 * It's the primary interface for users to organize and navigate their work streams.
 *
 * WHAT IT DOES:
 * - Displays projects in a beautiful, collapsible tree structure.
 * - Allows adding nested projects at any level.
 * - Supports a fully collapsed state for a minimal, icon-based view.
 * - Provides smooth animations and micro-interactions for an enhanced user experience.
 * - Handles user actions like renaming and deleting projects via a context menu.
 *
 * DEPENDENCIES:
 * - 'react': For building the component structure and managing state.
 * - 'lucide-react': For clear and modern iconography.
 *
 * STATE MANAGEMENT:
 * - The component is largely controlled by props passed from a parent container.
 * - `projects`: A flat record of all projects; hierarchy is established via `parentId`.
 * - `selectedProjectId`: The ID of the currently active project.
 * - `isCollapsed` (internal state): Manages the sidebar's expanded/collapsed view.
 *
 * DESIGN DECISIONS:
 * - A 20px indentation is used for each level of nesting to create a clear visual hierarchy.
 * - Smooth CSS transitions are used for colors and hover states to feel responsive.
 * - Folder icons change based on their state (open, closed, selected) to provide immediate feedback.
 * - Inline editing for adding and renaming projects is implemented with proper keyboard controls (Enter, Escape) and focus management for usability.
 * - Destructive actions like deletion are gated behind a user confirmation dialog to prevent data loss.
 */

import React, { useState } from 'react';
import { Folder, Plus, ChevronDown, ChevronRight, FolderPlus, PanelLeftOpen, PanelLeftClose, FolderOpen, X, MoreVertical, Pencil, Trash2 } from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  parentId: string | null;
}

interface ProjectSidebarProps {
  projects: Record<string, Project>;
  onSelectProject: (projectId: string) => void;
  onAddProject: (name: string, parentId: string | null) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
  onDeleteProject?: (projectId: string) => void;
  selectedProjectId: string | null;
}

// ============================================================================
// CONTEXT ANCHOR: ProjectItem
// PURPOSE: Renders a single, potentially nested, project entry in the sidebar.
//          It handles user interactions for selection, expansion, renaming, and deletion.
// DEPENDENCIES: 'react', 'lucide-react'.
// INVARIANTS:
// - It receives all state modification handlers (onSelect, onAdd, onRename, onDelete) from its parent.
// - It displays differently based on the sidebar's `isCollapsed` state.
// - It manages its own internal UI state (e.g., isExpanded, isAdding, isRenaming, isHovered).
// ============================================================================
const ProjectItem: React.FC<{
  project: Project;
  projects: Record<string, Project>;
  level: number;
  onSelectProject: (projectId: string) => void;
  selectedProjectId: string | null;
  onAddProject: (name: string, parentId: string | null) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
  onDeleteProject?: (projectId: string) => void;
  isCollapsed: boolean;
}> = ({ project, projects, level, onSelectProject, selectedProjectId, onAddProject, onRenameProject, onDeleteProject, isCollapsed }) => {
  
  const children = Object.values(projects).filter(p => p.parentId === project.id);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(project.name);

  const isSelected = selectedProjectId === project.id;
  const hasChildren = children.length > 0;

  const handleAddNestedProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim(), project.id);
      setNewProjectName('');
      setIsAdding(false);
      setIsExpanded(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddNestedProject();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewProjectName('');
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
    if (onDeleteProject && window.confirm(`Are you sure you want to delete "${project.name}" and all its sub-projects? This action cannot be undone.`)) {
      onDeleteProject(project.id);
    }
    setShowMenu(false);
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setRenameValue(project.name);
    }
  };

  // COLLAPSED VIEW
  if (isCollapsed) {
    return (
      <div className="mb-1">
        <button
          onClick={() => onSelectProject(project.id)}
          className={`w-full p-2.5 rounded-lg transition-all group relative ${
            isSelected
              ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-100'
              : 'hover:bg-slate-50 text-slate-600'
          }`}
          title={project.name}
        >
          {isSelected ? (
            <FolderOpen className="w-5 h-5 mx-auto" />
          ) : (
            <Folder className="w-5 h-5 mx-auto" />
          )}
          {hasChildren && !isSelected && (
            <div className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></div>
          )}
        </button>
      </div>
    );
  }

  // EXPANDED VIEW
  const indentPx = level * 20;

  return (
    <div className="mb-0.5">
      <div
        className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-orange-50 text-orange-900 ring-1 ring-orange-100'
            : 'hover:bg-slate-50 text-slate-700'
        }`}
        style={{ paddingLeft: `${indentPx + 8}px` }}
        onClick={() => onSelectProject(project.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse */}
        {(hasChildren || isAdding) ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`flex-shrink-0 p-0.5 rounded transition-colors ${
              isSelected ? 'text-orange-700' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Folder Icon */}
        <div className={`flex-shrink-0 transition-transform ${isHovered && !isSelected ? 'scale-110' : ''}`}>
          {isSelected ? (
            <FolderOpen className="w-5 h-5 text-orange-600" />
          ) : (
            <Folder className={`w-5 h-5 ${hasChildren ? 'text-orange-500' : 'text-slate-400'}`} />
          )}
        </div>

        {/* Project Name */}
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={handleRenameKeyPress}
            onBlur={handleRename}
            className="flex-1 px-2 py-1 text-[15px] font-medium bg-white border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 truncate text-[15px] font-medium ${
            isSelected ? 'text-orange-900' : 'text-slate-700'
          }`}>
            {project.name}
          </span>
        )}

        {/* Child Count Badge - Show on both selected and unselected */}
        {hasChildren && !isRenaming && (
          <span className={`flex-shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
            isSelected 
              ? 'bg-orange-100 text-orange-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {children.length}
          </span>
        )}

        {/* 3-Dot Menu Button */}
        {!isRenaming && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`flex-shrink-0 p-1.5 rounded-md transition-all ${
                showMenu
                  ? 'bg-slate-200 text-slate-700'
                  : isSelected
                  ? 'hover:bg-orange-100 text-orange-600 opacity-0 group-hover:opacity-100'
                  : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100'
              }`}
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameValue(project.name);
                      setIsRenaming(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Add Nested Button */}
        {!isRenaming && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsAdding(true);
              setIsExpanded(true);
            }}
            className={`flex-shrink-0 p-1.5 rounded-md transition-all ${
              isSelected
                ? 'hover:bg-orange-100 text-orange-600 opacity-0 group-hover:opacity-100'
                : 'hover:bg-slate-100 text-slate-400 hover:text-orange-600 opacity-0 group-hover:opacity-100'
            }`}
            title="Add nested project"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Children */}
      {isExpanded && (
        <div className="mt-0.5">
          {children.map(child => (
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
              <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                autoFocus
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Project name..."
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                onClick={e => e.stopPropagation()}
              />
              <button
                onClick={handleAddNestedProject}
                className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors"
                title="Add"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewProjectName('');
                }}
                className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
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
  selectedProjectId
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const rootProjects = Object.values(projects).filter(p => p.parentId === null);

  const handleAddNewRootProject = () => {
    const trimmedName = newProjectName.trim();
    if (trimmedName) {
      onAddProject(trimmedName, null);
      setNewProjectName('');
      setShowInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddNewRootProject();
    } else if (e.key === 'Escape') {
      setShowInput(false);
      setNewProjectName('');
    }
  };

  return (
    <div
      className={`bg-white border-r border-slate-200/60 flex flex-col h-screen flex-shrink-0 transition-all duration-300 shadow-sm ${
        isCollapsed ? 'w-16' : 'w-80'
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-4 border-b border-slate-200/60 flex items-center gap-3 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
              <Folder className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Projects</h2>
              <p className="text-[11px] text-slate-500">{rootProjects.length} workspace{rootProjects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-all hover:shadow-sm"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 p-3 overflow-y-auto">
        {rootProjects.length > 0 ? (
          <div className="space-y-0.5">
            {rootProjects.map(project => (
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
          !isCollapsed && (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 mb-1">No projects yet</h3>
              <p className="text-xs text-slate-500 mb-4">Create your first project to get started</p>
              <button
                onClick={() => setShowInput(true)}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Create project →
              </button>
            </div>
          )
        )}
      </div>

      {/* Add New Root Project */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-200/60 bg-slate-50/50">
          {showInput ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="New project name..."
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddNewRootProject}
                  className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors"
                >
                  Create Project
                </button>
                <button
                  onClick={() => {
                    setShowInput(false);
                    setNewProjectName('');
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors w-full justify-center"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;