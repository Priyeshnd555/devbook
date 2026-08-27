"use client";

import React, { useState } from "react";
import { useWorkflowManager } from "@features/workflow";
import { ProjectSidebar } from "@features/projects";
import { SettingsModal } from "@features/settings";
import { GlobalHeader } from "@features/layout";
import { WeeklyDashboard } from "@features/weekly";

const WeeklyRoadmap = () => {
    const {
        projects,
        selectedProjectId,
        weeklyOverviewData,
        handleSelectProject,
        handleSelectThread,
        addProject,
        renameProject,
        deleteProject,
        showCompleted,
        setShowCompleted,
        globalTotalTasks,
        globalCompletedTasks
    } = useWorkflowManager();

    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
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

            <div className="flex-1 flex flex-col min-w-0 relative">
                <GlobalHeader
                    activeRoute="weekly"
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onSelectProject={handleSelectProject}
                    onAddProject={addProject}
                    onRenameProject={renameProject}
                    onDeleteProject={deleteProject}
                    showCompleted={showCompleted}
                    onToggleShowCompleted={setShowCompleted}
                    onOpenSettings={() => setSettingsModalOpen(true)}
                    taskStats={{ completed: globalCompletedTasks, total: globalTotalTasks }}
                />

                <main className="flex-1 overflow-auto custom-scrollbar">
                    <WeeklyDashboard 
                        weeklyOverviewData={weeklyOverviewData}
                        handleSelectProject={handleSelectProject}
                        handleSelectThread={handleSelectThread}
                    />
                </main>
            </div >

            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
            />

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--color-border) / 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--color-primary) / 0.3);
                }
            `}</style>
        </div >
    );
};

export default WeeklyRoadmap;
