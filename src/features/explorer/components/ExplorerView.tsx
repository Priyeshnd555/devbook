"use client";

import React from "react";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { ThreadCard } from "@features/notes";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectSidebar } from "@features/projects";
import { GlobalHeader } from "@features/layout";
import { SettingsModal } from "@features/settings";
import { useWorkflowManager } from "@features/workflow";
import { countAllTasks, countAllCompletedTasks } from "@shared/utils";
import { formatRelativeDate } from "@shared/utils";

export const ExplorerView = () => {
  const {
    projects,
    selectedProjectId,
    threads,
    filteredThreadOrder,
    expandedThreads,
    selectedThreadId,
    selectedThread,
    globalTotalTasks,
    globalCompletedTasks,
    isAddingThread,
    newThreadTitle,
    addingSessionTo,
    editingThreadId,
    showCompleted,
    setShowCompleted,
    addProject,
    handleSelectProject,
    setIsAddingThread,
    setNewThreadTitle,
    addThread,
    handleSelectThread,
    updateThreadTitle,
    updateThreadStatus,
    deleteThread,
    toggleThread,
    addRootTaskToThread,
    setAddingSessionTo,
    addSession,
    setEditingThreadId,
    taskItemProps,
    renameProject,
    deleteProject,
    localShowCompleted,
    toggleThreadShowCompleted,
    updateThreadSort,
    updateTaskSort,
    threadsSortDirection,
    setThreadsSortDirection,
  } = useWorkflowManager();

  const [isSidebarVisible, setSidebarVisible] = React.useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-background font-sans">
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
      <div className="flex-1 flex flex-col">
        <GlobalHeader
          activeRoute="explorer"
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
          secondaryActions={
            <button
              onClick={() => setThreadsSortDirection(threadsSortDirection === 'asc' ? 'desc' : 'asc')}
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors focus:outline-none text-text-secondary hover:text-text-primary hover:bg-background"
              aria-label={`Threads sorted by ${threadsSortDirection === 'asc' ? 'oldest first' : 'newest first'}. Click to toggle.`}
            >
              {threadsSortDirection === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
              <span className="text-[10px] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {threadsSortDirection === 'asc' ? 'Oldest first' : 'Newest first'}
              </span>
            </button>
          }
          primaryAction={
            <button
              onClick={() => setIsAddingThread(true)}
              className="flex items-center gap-2 bg-primary text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!selectedProjectId}
              title={
                !selectedProjectId
                  ? "Select a project to add a thread"
                  : "Add new thread"
              }
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Thread</span>
            </button>
          }
        />

        <main
          className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-8 py-6 w-full overflow-auto
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden"
        >
          <div className="md:col-span-2">
            {isAddingThread && (
              <div className="mb-4 p-4 bg-surface rounded-lg border border-border shadow-sm flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-text-primary">New thread</h3>
                <input
                  type="text"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Thread title..."
                  className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-text-primary placeholder:text-text-secondary/60"
                  autoFocus
                  onKeyPress={(e) => e.key === "Enter" && addThread()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={addThread}
                    className="px-3.5 py-1.5 bg-primary text-white text-xs rounded-md hover:bg-primary-hover transition-colors font-medium shadow-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingThread(false);
                      setNewThreadTitle("");
                    }}
                    className="px-3.5 py-1.5 bg-surface text-text-secondary border border-border rounded-md text-xs hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <AnimatePresence>
                {filteredThreadOrder.map((threadId, index) => {
                  const thread = threads[threadId];
                  if (!thread) return null;
                  const totalTasks = countAllTasks(thread.tasks);
                  const completedTasks = countAllCompletedTasks(thread.tasks);
                  return (
                    <motion.div
                      key={thread.id}
                      layout
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <ThreadCard
                        thread={thread}
                        threadNumber={index + 1}
                        totalTaskCount={totalTasks}
                        completedTaskCount={completedTasks}
                        isSelected={selectedThreadId === thread.id}
                        onSelect={() => handleSelectThread(thread.id)}
                        isThreadExpanded={expandedThreads.has(thread.id)}
                        toggleThread={toggleThread}
                        onUpdateTitle={updateThreadTitle}
                        onDelete={deleteThread}
                        onAddRootTask={addRootTaskToThread}
                        onUpdateStatus={updateThreadStatus}
                        addingSessionTo={addingSessionTo}
                        setAddingSessionTo={setAddingSessionTo}
                        onAddSession={addSession}
                        editingThreadId={editingThreadId}
                        setEditingThreadId={setEditingThreadId}
                        taskItemProps={taskItemProps}
                        showCompleted={showCompleted}
                        localShowCompleted={
                          localShowCompleted[thread.id] ?? false
                        }
                        onToggleLocalShowCompleted={() =>
                          toggleThreadShowCompleted(thread.id)
                        }
                        onUpdateThreadSort={updateThreadSort}
                        onUpdateTaskSort={updateTaskSort}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="sticky top-6">
              {selectedThread ? (
                <div
                  className={`bg-surface rounded-lg border shadow-xs mb-4 transition-all ${selectedThreadId === selectedThread.id ? "border-primary/40 ring-1 ring-primary/20" : "border-border"}`}
                >
                  <div className="p-4 border-b border-border">
                    <h2 className="text-base font-semibold text-text-primary">
                      Session Log
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5 truncate">
                      {selectedThread.title}
                    </p>
                  </div>
                  <div
                    className="p-4 space-y-3 max-h-[calc(100vh-18rem)] overflow-auto
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden"
                  >
                    {selectedThread.sessions.length > 0 ? (
                      selectedThread.sessions.map((session, idx) => (
                        <div
                          key={`${selectedThread.id}-session-${idx}`}
                          className="bg-background rounded-lg p-3 text-xs border border-border wrap-break-word shadow-2xs"
                        >
                          <div
                            className="text-text-secondary mb-1.5 font-medium text-xs"
                            title={`${session.date} at ${session.time}`}
                          >
                            {formatRelativeDate(session.date)} at {session.time}
                          </div>
                          <div className="text-text-primary leading-relaxed whitespace-pre-wrap">
                            {session.notes}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-xs text-text-secondary">
                        <p>No sessions logged for this thread.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-sm text-text-secondary">
                  <p>Select a thread to view its session log.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
};
