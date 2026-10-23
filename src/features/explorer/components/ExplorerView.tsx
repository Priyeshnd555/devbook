"use client";

import React, { useState } from "react";
import { Plus, ArrowUp, ArrowDown, LayoutGrid, List, GitMerge } from "lucide-react";
import { ThreadCard, MergeThreadsModal, DeleteCardModal } from "@features/notes";
import { Thread } from "@shared/types";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectSidebar } from "@features/projects";
import { GlobalHeader } from "@features/layout";
import { SettingsModal } from "@features/settings";
import { useWorkflowManager } from "@features/workflow";
import { LucidCanvas } from "@features/lucid";
import { countAllTasks, countAllCompletedTasks } from "@shared/utils";
import { formatRelativeDate } from "@shared/utils";

interface ExplorerViewProps {
  defaultView?: "list" | "canvas";
}

export const ExplorerView: React.FC<ExplorerViewProps> = ({ defaultView = "list" }) => {
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
    mergeThreads,
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
    connections,
    updateThreadPosition,
    updateThreadDimensions,
    updateThreadTasks,
    createConnection,
    removeConnection,
    unlinkThread,
  } = useWorkflowManager();

  const [viewMode, setViewMode] = useState<"list" | "canvas">(defaultView);
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [mergeSourceThreadId, setMergeSourceThreadId] = useState<string | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<Thread | null>(null);

  const handleOpenMergeModal = (threadId?: string) => {
    setMergeSourceThreadId(threadId || null);
    setIsMergeModalOpen(true);
  };

  const handleRequestDelete = (threadId: string) => {
    const thread = threads[threadId];
    if (thread) {
      setThreadToDelete(thread);
    }
  };

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
          activeRoute={viewMode === "canvas" ? "lucid" : "explorer"}
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
          primaryAction={
            viewMode === "list" ? (
              <button
                onClick={() => setIsAddingThread(true)}
                className="flex items-center gap-2 bg-primary text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                disabled={!selectedProjectId}
                title={!selectedProjectId ? "Select a project to add a task" : "Add new task"}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            ) : (
              <button
                onClick={() => addThread("", 120 + Math.random() * 200, 120 + Math.random() * 150)}
                className="flex items-center gap-2 bg-primary text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-primary-hover shadow-sm transition-colors cursor-pointer"
                title="Add new task to canvas"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )
          }
        />

        {/* Content Area with Sub-controls in Right Top Corner Below Header */}
        <div className="flex-1 min-h-0 relative flex flex-col">
          {/* Right Top Corner Controls */}
          <div className="absolute top-3 right-6 z-30 flex items-center gap-2 pointer-events-auto">
            {viewMode === "canvas" ? (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('lucid:autoArrange'))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-primary hover:bg-surface bg-surface/90 border border-border/80 shadow-xs backdrop-blur-md transition-all cursor-pointer"
                title="Auto arrange cards to prevent overlap"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Auto Arrange</span>
              </button>
            ) : (
              <button
                onClick={() => setThreadsSortDirection(threadsSortDirection === "asc" ? "desc" : "asc")}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface bg-surface/90 border border-border/80 shadow-xs backdrop-blur-md transition-all cursor-pointer"
                aria-label={`Threads sorted by ${threadsSortDirection === "asc" ? "oldest first" : "newest first"}`}
              >
                {threadsSortDirection === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )}
                <span className="text-[11px] whitespace-nowrap">
                  {threadsSortDirection === "asc" ? "Oldest first" : "Newest first"}
                </span>
              </button>
            )}

            {filteredThreadOrder.length >= 2 && (
              <button
                id="merge-cards-header-btn"
                onClick={() => handleOpenMergeModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary hover:text-primary hover:bg-surface bg-surface/90 border border-border/80 shadow-xs backdrop-blur-md transition-all cursor-pointer"
                title="Combine or merge cards"
              >
                <GitMerge className="w-3.5 h-3.5 text-primary" />
                <span>Merge Cards</span>
              </button>
            )}

            {/* List and All Cards View Switcher */}
            <div className="flex items-center p-0.5 bg-surface/95 border border-border/80 rounded-lg shadow-xs backdrop-blur-md">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? "bg-primary text-white font-bold shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-background/50"
                }`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'canvas'
                    ? "bg-primary text-white font-bold shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-background/50"
                }`}
                title="All cards at once (Canvas view)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Cards</span>
              </button>
            </div>
          </div>

          {viewMode === "canvas" ? (
            <LucidCanvas
              activeProjectId={selectedProjectId || "proj-inbox"}
              showCompleted={showCompleted}
              localShowCompleted={localShowCompleted}
              onToggleLocalShowCompleted={toggleThreadShowCompleted}
              taskItemProps={taskItemProps}
              threads={threads}
              connections={connections}
              expandedThreads={expandedThreads}
              onToggleThread={toggleThread}
              onAddThread={addThread}
              onUpdateThreadPosition={updateThreadPosition}
              onUpdateThreadDimensions={updateThreadDimensions}
              onUpdateThreadTitle={updateThreadTitle}
              onUpdateThreadStatus={updateThreadStatus}
              onUpdateThreadTasks={updateThreadTasks}
              onDeleteThread={handleRequestDelete}
              onOpenMergeModal={handleOpenMergeModal}
              onUnlinkThread={unlinkThread}
              onCreateConnection={createConnection}
              onRemoveConnection={removeConnection}
            />
          ) : (
          <main
            className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-8 pt-14 pb-6 w-full overflow-auto
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden"
          >
            <div className="md:col-span-2">
              {/* Notepad-style card creation */}
              {isAddingThread && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 bg-surface rounded-xl border border-primary/30 shadow-sm p-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <textarea
                        value={newThreadTitle}
                        onChange={(e) => {
                          setNewThreadTitle(e.target.value);
                          e.target.style.height = "auto";
                          e.target.style.height = e.target.scrollHeight + "px";
                        }}
                        placeholder="Write a thought or thread title..."
                        rows={1}
                        className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-base font-medium text-text-primary placeholder:text-text-secondary/40 resize-none font-sans leading-relaxed"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (newThreadTitle.trim()) addThread();
                          }
                          if (e.key === "Escape") {
                            setIsAddingThread(false);
                            setNewThreadTitle("");
                          }
                        }}
                      />
                      <div className="mt-3 pt-2.5 border-t border-border/10 flex items-center justify-between text-xs text-text-secondary">
                        <span className="text-[11px] text-text-secondary/60">
                          Enter to save • Esc to cancel
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setIsAddingThread(false);
                              setNewThreadTitle("");
                            }}
                            className="px-2.5 py-1 text-text-secondary hover:text-text-primary rounded transition-colors text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => addThread()}
                            disabled={!newThreadTitle.trim()}
                            className="px-3 py-1 bg-primary text-white font-medium rounded hover:bg-primary-hover disabled:opacity-40 transition-colors shadow-xs text-xs cursor-pointer"
                          >
                            Add Task
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
                          onDelete={handleRequestDelete}
                          onMerge={handleOpenMergeModal}
                          onAddRootTask={addRootTaskToThread}
                          onUpdateStatus={updateThreadStatus}
                          addingSessionTo={addingSessionTo}
                          setAddingSessionTo={setAddingSessionTo}
                          onAddSession={addSession}
                          editingThreadId={editingThreadId}
                          setEditingThreadId={setEditingThreadId}
                          taskItemProps={taskItemProps}
                          showCompleted={showCompleted}
                          localShowCompleted={localShowCompleted[thread.id] ?? false}
                          onToggleLocalShowCompleted={() => toggleThreadShowCompleted(thread.id)}
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
                    className={`bg-surface rounded-lg border shadow-xs mb-4 transition-all ${
                      selectedThreadId === selectedThread.id
                        ? "border-primary/40 ring-1 ring-primary/20"
                        : "border-border"
                    }`}
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
        )}
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
      <MergeThreadsModal
        isOpen={isMergeModalOpen}
        onClose={() => {
          setIsMergeModalOpen(false);
          setMergeSourceThreadId(null);
        }}
        initialSourceId={mergeSourceThreadId}
        threads={threads}
        threadOrder={filteredThreadOrder}
        onMerge={mergeThreads}
      />
      <DeleteCardModal
        isOpen={!!threadToDelete}
        onClose={() => setThreadToDelete(null)}
        onConfirm={() => {
          if (threadToDelete) {
            deleteThread(threadToDelete.id);
            setThreadToDelete(null);
          }
        }}
        thread={threadToDelete}
        threadNumber={
          threadToDelete
            ? filteredThreadOrder.indexOf(threadToDelete.id) + 1
            : undefined
        }
      />
    </div>
  );
};
