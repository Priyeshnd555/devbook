/**
 * WHY: Project sidebar for hierarchical navigation with polished modern UI
 * 
 * WHAT IT DOES:
 * - Displays projects in a beautiful collapsible tree structure
 * - Allows adding nested projects at any level
 * - Supports sidebar collapse for minimal view
 * - Provides smooth animations and micro-interactions
 * 
 * DEPENDENCIES:
 * - react: Core React library
 * - lucide-react: Icon components
 * 
 * STATE MANAGEMENT:
 * - projects: Record of all projects (flat structure, hierarchy via parentId)
 * - selectedProjectId: Currently active project
 * - isCollapsed: Sidebar expanded/collapsed state
 * 
 * DESIGN DECISIONS:
 * - Uses 20px indentation per level for clear hierarchy
 * - Smooth color transitions and hover states
 * - Folder icons change based on state (open/closed/selected)
 * - Inline editing with proper focus management
 */

import React, { useState } from 'react';
import { Folder, Plus, ChevronDown, ChevronRight, FolderPlus, PanelLeftOpen, PanelLeftClose, FolderOpen, X } from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  parentId: string | null;
}

interface ProjectSidebarProps {
  projects: Record<string, Project>;
  onSelectProject: (projectId: string) => void;
  onAddProject: (name: string, parentId: string | null) => void;
  selectedProjectId: string | null;
}

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isHovered, setIsHovered] = useState(false);

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
        <span className={`flex-1 truncate text-[15px] font-medium ${
          isSelected ? 'text-orange-900' : 'text-slate-700'
        }`}>
          {project.name}
        </span>

        {/* Child Count Badge - Show on both selected and unselected */}
        {hasChildren && (
          <span className={`flex-shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
            isSelected 
              ? 'bg-orange-100 text-orange-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {children.length}
          </span>
        )}

        {/* Add Nested Button */}
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