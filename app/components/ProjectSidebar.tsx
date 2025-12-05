
/**
 * @file ProjectSidebar.tsx
 * @purpose Renders a collapsible sidebar for navigating a hierarchical project structure.
 * @description This module contains the `ProjectSidebar` component and its helper component, `ProjectItem`.
 * It allows users to view projects in a tree, add new root-level projects, add nested projects,
 * and collapse the sidebar for a minimal view.
 * @dependencies
 * - react
 * - lucide-react (for icons)
 * @invariants
 * - The `projects` data structure is a flat record/dictionary, and the hierarchy is derived from `parentId`.
 */
import React, { useState } from 'react';
import { Folder, Plus, ChevronDown, ChevronRight, FolderPlus, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

/**
 * CONTEXT ANCHOR
 * PURPOSE: Represents a single project entity within the hierarchical structure.
 * DEPENDENCIES: None
 * INVARIANTS: `id` must be unique. `parentId` must either be `null` or point to an existing project `id`.
 */
export interface Project {
  /** A unique identifier for the project. */
  id: string;
  /** The display name of the project. */
  name: string;
  /** The ID of the parent project, or null if it's a root project. */
  parentId: string | null;
}

/**
 * CONTEXT ANCHOR
 * PURPOSE: Defines the contract for the main ProjectSidebar component.
 * DEPENDENCIES: `Project` interface
 * INVARIANTS: `projects` must be a valid record of `Project` objects. Callbacks `onSelectProject` and `onAddProject` must be provided.
 */
interface ProjectSidebarProps {
  /**
   * A record of all projects, indexed by their ID.
   * This is a flat data structure from which the tree hierarchy is derived.
   */
  projects: Record<string, Project>;
  /**
   * Callback function invoked when a project is selected.
   * @param projectId The ID of the selected project.
   */
  onSelectProject: (projectId: string) => void;
  /**
   * Callback function invoked to add a new project.
   * @param name The name of the new project.
   * @param parentId The ID of the parent project, or null for a root project.
   */
  onAddProject: (name: string, parentId: string | null) => void;
  /** The ID of the currently selected project, or null if none is selected. */
  selectedProjectId: string | null;
}

// =================================================================================================
// STRATEGY: Define constants for styling to avoid magic numbers and improve maintainability.
// These values are chosen for a balanced and visually pleasing layout.
// =================================================================================================
const INDENTATION_STEP_REM = 1.5;

/**
 * CONTEXT ANCHOR
 * PURPOSE: Renders a single item in the project tree, handling nesting, expansion, and inline creation of sub-projects.
 * DEPENDENCIES: `lucide-react` for icons. Recursively uses itself to render children.
 * INVARIANTS: Expects a valid `project` object and the full `projects` map to find children.
 */
const ProjectItem: React.FC<{
    project: Project;
    projects: Record<string, Project>;
    level: number;
    onSelectProject: (projectId: string) => void;
    selectedProjectId: string | null;
    onAddProject: (name: string, parentId: string | null) => void;
    isCollapsed: boolean;
}> = ({ project, projects, level, onSelectProject, selectedProjectId, onAddProject, isCollapsed }) => {
    const children = Object.values(projects).filter(p => p.parentId === project.id);
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [isAdding, setIsAdding] = React.useState(false);
    const [newProjectName, setNewProjectName] = React.useState('');

    const handleAddNestedProject = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (newProjectName.trim()) {
            onAddProject(newProjectName, project.id);
            setNewProjectName('');
            setIsAdding(false);
            // STRATEGY: Auto-expand the parent project after adding a new child to make the new item visible.
            setIsExpanded(true);
        }
    }

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(current => !current);
    }
    
    const handleToggleAdding = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAdding(current => !current);
        // STRATEGY: If user starts adding a project, ensure the parent is expanded.
        if (!isAdding) {
            setIsExpanded(true);
        }
    }

    // --- RENDER LOGIC ---

    if (isCollapsed) {
        return (
            <div>
                <div title={project.name} onClick={() => onSelectProject(project.id)} className={`group flex items-center justify-center p-2 rounded-md cursor-pointer ${selectedProjectId === project.id ? 'bg-gray-700' : 'hover:bg-gray-600'}`}>
                    <Folder className="w-5 h-5" />
                </div>
                <div>
                    {children.map(child => (
                        <ProjectItem key={child.id} project={child} projects={projects} level={level + 1} onSelectProject={onSelectProject} selectedProjectId={selectedProjectId} onAddProject={onAddProject} isCollapsed={isCollapsed}/>
                    ))}
                </div>
            </div>
        )
    }

    const paddingLeftRem = level * INDENTATION_STEP_REM + 0.5;

    return (
        <div>
            <div 
                className={`group flex items-center p-2 rounded-md cursor-pointer ${selectedProjectId === project.id ? 'bg-gray-700' : 'hover:bg-gray-600'}`}
                style={{ paddingLeft: `${paddingLeftRem}rem` }}
                onClick={() => onSelectProject(project.id)}
            >
                {children.length > 0 || isAdding ? (
                    <div onClick={handleToggleExpand} className="w-4 h-4 mr-2 flex-shrink-0">
                     {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                ) : <div className="w-4 h-4 mr-2 flex-shrink-0"/>}
                <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="flex-1 truncate">{project.name}</span>
                <button onClick={handleToggleAdding} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <FolderPlus className="w-4 h-4" />
                </button>
            </div>
            {isExpanded && (
                <div style={{ paddingLeft: `${level * INDENTATION_STEP_REM}rem` }}>
                    {children.map(child => (
                        <ProjectItem key={child.id} project={child} projects={projects} level={level + 1} onSelectProject={onSelectProject} selectedProjectId={selectedProjectId} onAddProject={onAddProject} isCollapsed={isCollapsed}/>
                    ))}
                    {isAdding && (
                        <div className="flex items-center gap-2 p-2" style={{ paddingLeft: `${INDENTATION_STEP_REM}rem` }}>
                            <input 
                                type="text"
                                autoFocus
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                placeholder="New nested project"
                                className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none"
                                onKeyPress={e => e.key === 'Enter' && handleAddNestedProject(e as any)}
                                onClick={e => e.stopPropagation()}
                            />
                             <button onClick={handleAddNestedProject} className="p-2 bg-orange-600 rounded hover:bg-orange-700">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// =================================================================================================
// STRATEGY: Define constants for styling to avoid magic numbers and improve maintainability.
// `w-80` (320px) provides ample space for project names in expanded view.
// `w-20` (80px) is wide enough for icons and tooltips in collapsed view.
// =================================================================================================
const SIDEBAR_WIDTH_EXPANDED = 'w-80';
const SIDEBAR_WIDTH_COLLAPSED = 'w-20';

/**
 * CONTEXT ANCHOR
 * PURPOSE: Renders the entire collapsible project sidebar, including the header, the list of root projects, and the input form for new root projects.
 * DEPENDENCIES: `ProjectItem` component.
 * INVARIANTS: Must be provided with `projects` data and callbacks.
 *
 * STATE MANAGEMENT:
 * - `newProjectName`: Manages the input for creating a new root-level project.
 * - `isCollapsed`: Manages the collapsed/expanded state of the entire sidebar.
 */
const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projects, onSelectProject, onAddProject, selectedProjectId}) => {
  const [newProjectName, setNewProjectName] = React.useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const rootProjects = Object.values(projects).filter(p => p.parentId === null);

  /**
   * AI-REFACTORING-NOTE: Converted from an inline arrow function to a declared constant
   * for better debuggability and clearer intent, as per AI coding guidelines.
   * This function toggles the `isCollapsed` state for the entire sidebar.
   */
  const handleToggleCollapse = () => {
    setIsCollapsed(currentIsCollapsed => !currentIsCollapsed);
  }

  /**
   * AI-REFACTORING-NOTE: Explicitly named function for adding a new root-level project.
   * This improves traceability over an anonymous inline function.
   */
  const handleAddNewRootProject = () => {
    const trimmedName = newProjectName.trim();
    if (trimmedName) {
      onAddProject(trimmedName, null);
      setNewProjectName('');
    }
  };

  return (
    <div className={`bg-gray-800 text-white flex flex-col h-screen flex-shrink-0 transition-all duration-300 z-30 ${isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED}`}>
      <div className={`p-4 border-b border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h2 className="text-lg font-semibold">Projects</h2>}
        <button onClick={handleToggleCollapse} className="p-1 rounded-md hover:bg-gray-700">
            {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
      </div>
    {/* 
      STRATEGY: The main content of the sidebar (the project list) is conditionally rendered.
      When collapsed, we render a simplified version within ProjectItem to just show icons.
      When expanded, we render the full interactive tree.
    */}
    {!isCollapsed  &&  <div className="flex-1 p-2 overflow-y-auto">
        {rootProjects.map(project => (
            <ProjectItem key={project.id} project={project} projects={projects} level={0} onSelectProject={onSelectProject} selectedProjectId={selectedProjectId} onAddProject={onAddProject} isCollapsed={isCollapsed} />
        ))}
      </div>}
      {/* 
        STRATEGY: The "add new project" form at the bottom is only shown when the sidebar is expanded,
        as there is no space for it in the collapsed view.
      */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
                <input 
                    type="text" 
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="New project name"
                    className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none"
                    onKeyPress={e => e.key === 'Enter' && handleAddNewRootProject()}
                />
                <button onClick={handleAddNewRootProject} className="p-2 bg-orange-600 rounded hover:bg-orange-700">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
