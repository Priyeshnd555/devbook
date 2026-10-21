"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkflowManager } from '@features/workflow';
import { ProjectSidebar } from '@features/projects';
import { SettingsModal } from '@features/settings';
import { GlobalHeader } from '@features/layout';
import { LucidCanvas } from '@features/lucid';

export default function LucidPage() {
  const {
    projects,
    selectedProjectId,
    handleSelectProject,
    addProject,
    deleteProject,
    renameProject,
    taskItemProps,
    showCompleted,
    setShowCompleted
  } = useWorkflowManager();

  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <ProjectSidebar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onAddProject={addProject}
        onSelectProject={handleSelectProject}
        onDeleteProject={deleteProject}
        onRenameProject={renameProject}
        isSidebarVisible={isSidebarVisible}
        onToggle={() => setSidebarVisible(!isSidebarVisible)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <GlobalHeader
          activeRoute="lucid"
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
          onAddProject={addProject}
          onRenameProject={renameProject}
          onDeleteProject={deleteProject}
          showCompleted={showCompleted}
          onToggleShowCompleted={setShowCompleted}
          onOpenSettings={() => setSettingsModalOpen(true)}
          primaryAction={
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('lucid:addCard'))}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg hover:bg-primary-hover transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Card</span>
            </button>
          }
        />

        <LucidCanvas 
          activeProjectId={selectedProjectId || 'default'}
          showCompleted={showCompleted}
          taskItemProps={taskItemProps}
        />
      </div>
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
