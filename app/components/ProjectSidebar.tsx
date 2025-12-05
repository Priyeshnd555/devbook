
import React, { useState } from 'react';
import { Folder, Plus, ChevronDown, ChevronRight, FolderPlus, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

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
    const [isExpanded, setIsExpanded] = React.useState(true);
    const [isAdding, setIsAdding] = React.useState(false);
    const [newProjectName, setNewProjectName] = React.useState('');

    const handleAddProject = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (newProjectName.trim()) {
            onAddProject(newProjectName, project.id);
            setNewProjectName('');
            setIsAdding(false);
            setIsExpanded(true);
        }
    }

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

    return (
        <div>
            <div 
                className={`group flex items-center p-2 rounded-md cursor-pointer ${selectedProjectId === project.id ? 'bg-gray-700' : 'hover:bg-gray-600'}`}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                onClick={() => onSelectProject(project.id)}
            >
                {children.length > 0 || isAdding ? (
                    <div onClick={(e) => {e.stopPropagation(); setIsExpanded(!isExpanded);}} className="w-4 h-4 mr-2 flex-shrink-0">
                     {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                ) : <div className="w-4 h-4 mr-2 flex-shrink-0"/>}
                <Folder className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="flex-1 truncate">{project.name}</span>
                <button onClick={(e) => { e.stopPropagation(); setIsAdding(!isAdding); setIsExpanded(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                    <FolderPlus className="w-4 h-4" />
                </button>
            </div>
            {isExpanded && (
                <div style={{ paddingLeft: `${level * 1.5}rem` }}>
                    {children.map(child => (
                        <ProjectItem key={child.id} project={child} projects={projects} level={level + 1} onSelectProject={onSelectProject} selectedProjectId={selectedProjectId} onAddProject={onAddProject} isCollapsed={isCollapsed}/>
                    ))}
                    {isAdding && (
                        <div className="flex items-center gap-2 p-2" style={{ paddingLeft: `1.5rem` }}>
                            <input 
                                type="text"
                                autoFocus
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                placeholder="New nested project"
                                className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none"
                                onKeyPress={e => e.key === 'Enter' && handleAddProject(e as any)}
                                onClick={e => e.stopPropagation()}
                            />
                             <button onClick={handleAddProject} className="p-2 bg-orange-600 rounded hover:bg-orange-700">
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

const ProjectSidebar: React.FC<ProjectSidebarProps> = ({ projects, onSelectProject, onAddProject, selectedProjectId}) => {
  const [newProjectName, setNewProjectName] = React.useState('');
  const rootProjects = Object.values(projects).filter(p => p.parentId === null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const onToggle=(): void=>{
    setIsCollapsed(prev=>!prev)
  }

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      onAddProject(newProjectName, null);
      setNewProjectName('');
    }
  };

  return (
    <div className={`bg-gray-800 text-white flex flex-col h-screen flex-shrink-0 transition-all duration-300 z-30 ${isCollapsed ? 'w-20' : 'w-80'}`}>
      <div className={`p-4 border-b border-gray-700 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <h2 className="text-lg font-semibold">Projects</h2>}
        <button onClick={onToggle} className="p-1 rounded-md hover:bg-gray-700">
            {isCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </button>
      </div>
    {!isCollapsed  &&  <div className="flex-1 p-2 overflow-y-auto">
        {rootProjects.map(project => (
            <ProjectItem key={project.id} project={project} projects={projects} level={0} onSelectProject={onSelectProject} selectedProjectId={selectedProjectId} onAddProject={onAddProject} isCollapsed={isCollapsed} />
        ))}
      </div>}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
                <input 
                    type="text" 
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    placeholder="New project name"
                    className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm focus:outline-none"
                    onKeyPress={e => e.key === 'Enter' && handleAddProject()}
                />
                <button onClick={handleAddProject} className="p-2 bg-orange-600 rounded hover:bg-orange-700">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
