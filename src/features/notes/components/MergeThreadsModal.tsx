"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GitMerge, X, ArrowLeftRight, CheckCircle2, Layers, Clock, AlertCircle } from "lucide-react";
import { Thread } from "@shared/types";
import { countAllTasks } from "@shared/utils";

interface MergeThreadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceId?: string | null;
  initialTargetId?: string | null;
  threads: Record<string, Thread>;
  threadOrder: string[];
  onMerge: (
    sourceThreadId: string,
    targetThreadId: string,
    options?: { customTitle?: string }
  ) => void;
}

interface MergeThreadsModalContentProps {
  onClose: () => void;
  initialSourceId?: string | null;
  initialTargetId?: string | null;
  threads: Record<string, Thread>;
  threadOrder: string[];
  availableThreads: Thread[];
  onMerge: (
    sourceThreadId: string,
    targetThreadId: string,
    options?: { customTitle?: string }
  ) => void;
}

const MergeThreadsModalContent: React.FC<MergeThreadsModalContentProps> = ({
  onClose,
  initialSourceId,
  initialTargetId,
  threads,
  threadOrder,
  availableThreads,
  onMerge,
}) => {
  // Compute default IDs synchronously on initial mount so there is zero render delay or flicker
  const defaultSourceId = useMemo(() => {
    if (initialSourceId && threads[initialSourceId]) return initialSourceId;
    return availableThreads[0]?.id || "";
  }, [initialSourceId, threads, availableThreads]);

  const defaultTargetId = useMemo(() => {
    if (initialTargetId && threads[initialTargetId] && initialTargetId !== defaultSourceId) {
      return initialTargetId;
    }
    return availableThreads.find((t) => t.id !== defaultSourceId)?.id || "";
  }, [initialTargetId, threads, defaultSourceId, availableThreads]);

  const [sourceId, setSourceId] = useState<string>(() => defaultSourceId);
  const [targetId, setTargetId] = useState<string>(() => defaultTargetId);
  const [titleMode, setTitleMode] = useState<"target" | "combined" | "custom">("target");
  const [customTitle, setCustomTitle] = useState<string>(
    () => (defaultTargetId && threads[defaultTargetId]?.title) || ""
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const sourceThread = sourceId ? threads[sourceId] : null;
  const targetThread = targetId ? threads[targetId] : null;

  const getThreadDisplayName = (thread: Thread | null | undefined, index?: number) => {
    if (!thread) return "Thread";
    const trimmed = thread.title?.trim();
    if (trimmed) return trimmed;
    if (typeof index === "number") return `Thread ${index + 1}`;
    const idx = threadOrder.indexOf(thread.id);
    if (idx !== -1) return `Thread ${idx + 1}`;
    return "Untitled Thread";
  };

  // Handle swapping source and target
  const handleSwap = () => {
    const prevSrc = sourceId;
    const prevTgt = targetId;
    setSourceId(prevTgt);
    setTargetId(prevSrc);
    if (titleMode === "target" && threads[prevSrc]) {
      setCustomTitle(getThreadDisplayName(threads[prevSrc]));
    }
  };

  // Derive final title based on user selection
  const computedFinalTitle = useMemo(() => {
    if (!targetThread) return "";
    const targetName = getThreadDisplayName(targetThread);
    const sourceName = getThreadDisplayName(sourceThread);
    if (titleMode === "target") return targetName;
    if (titleMode === "combined" && sourceThread) {
      return `${targetName} & ${sourceName}`;
    }
    return customTitle || targetName;
  }, [titleMode, targetThread, sourceThread, customTitle, threadOrder]);

  const sourceTaskCount = sourceThread ? countAllTasks(sourceThread.tasks) : 0;
  const targetTaskCount = targetThread ? countAllTasks(targetThread.tasks) : 0;
  const totalTasksAfterMerge = sourceTaskCount + targetTaskCount;

  const sourceSessionCount = sourceThread?.sessions?.length || 0;
  const targetSessionCount = targetThread?.sessions?.length || 0;
  const totalSessionsAfterMerge = sourceSessionCount + targetSessionCount;

  const handleConfirmMerge = () => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    onMerge(sourceId, targetId, {
      customTitle: computedFinalTitle,
    });
    onClose();
  };

  return (
    <motion.div
      key="merge-threads-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 [transform:translateZ(0)]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-xl overflow-hidden flex flex-col [transform:translateZ(0)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="merge-threads-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="merge-threads-modal-title"
                className="text-base font-semibold text-text-primary"
              >
                Combine & Merge Thread Cards
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Merge tasks, comments, and work sessions from two threads into one.
              </p>
            </div>
          </div>
          <button
            id="close-merge-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {availableThreads.length < 2 ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-warning/10 text-warning mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary">
              Not enough thread cards to merge
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
              You need at least two thread cards in this project to combine or merge them.
            </p>
            <button
              onClick={onClose}
              className="mt-5 px-4 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-xs cursor-pointer"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)]">
            {/* Visual Merge Flow Selection */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-center">
              {/* Source Thread (From) */}
              <div className="p-3.5 bg-background rounded-lg border border-border/80 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    Card to Merge (From)
                  </span>
                  <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded font-medium">
                    Will be removed
                  </span>
                </div>
                <select
                  id="merge-source-select"
                  value={sourceId}
                  onChange={(e) => {
                    const newSrc = e.target.value;
                    setSourceId(newSrc);
                    if (newSrc === targetId) {
                      const nextTgt = availableThreads.find((t) => t.id !== newSrc)?.id || "";
                      setTargetId(nextTgt);
                    }
                  }}
                  className="w-full bg-surface border border-border text-xs rounded-md p-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  {availableThreads.map((thread, idx) => (
                    <option key={`src-${thread.id}`} value={thread.id}>
                      {getThreadDisplayName(thread, idx)} ({countAllTasks(thread.tasks)} tasks)
                    </option>
                  ))}
                </select>
                {sourceThread && (
                  <div className="flex items-center gap-3 text-[11px] text-text-secondary pt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {sourceTaskCount} tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {sourceSessionCount} sessions
                    </span>
                  </div>
                )}
              </div>

              {/* Swap / Direction button */}
              <div className="flex justify-center">
                <button
                  id="merge-swap-btn"
                  type="button"
                  onClick={handleSwap}
                  className="p-2 rounded-full border border-border bg-surface hover:bg-primary-light text-text-secondary hover:text-primary transition-all shadow-xs group cursor-pointer"
                  title="Swap From and Into threads"
                >
                  <ArrowLeftRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Target Thread (Into) */}
              <div className="p-3.5 bg-background rounded-lg border border-primary/40 ring-1 ring-primary/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    Target Card (Into)
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                    Keeps all items
                  </span>
                </div>
                <select
                  id="merge-target-select"
                  value={targetId}
                  onChange={(e) => {
                    const newTgt = e.target.value;
                    setTargetId(newTgt);
                    if (newTgt === sourceId) {
                      const nextSrc = availableThreads.find((t) => t.id !== newTgt)?.id || "";
                      setSourceId(nextSrc);
                    }
                  }}
                  className="w-full bg-surface border border-border text-xs rounded-md p-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  {availableThreads.map((thread, idx) => (
                    <option
                      key={`tgt-${thread.id}`}
                      value={thread.id}
                      disabled={thread.id === sourceId}
                    >
                      {getThreadDisplayName(thread, idx)} ({countAllTasks(thread.tasks)} tasks)
                    </option>
                  ))}
                </select>
                {targetThread && (
                  <div className="flex items-center gap-3 text-[11px] text-text-secondary pt-1">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {targetTaskCount} tasks
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {targetSessionCount} sessions
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Title after merge */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-semibold text-text-primary block">
                Title for the Merged Card
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="title-mode-target"
                  type="button"
                  onClick={() => {
                    setTitleMode("target");
                    setCustomTitle(getThreadDisplayName(targetThread));
                  }}
                  className={`px-3 py-2 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                    titleMode === "target"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-text-secondary hover:bg-background"
                  }`}
                >
                  <div className="text-[11px] opacity-70">Target Title</div>
                  <div className="truncate font-semibold mt-0.5">
                    {getThreadDisplayName(targetThread)}
                  </div>
                </button>

                <button
                  id="title-mode-combined"
                  type="button"
                  onClick={() => {
                    setTitleMode("combined");
                    setCustomTitle(
                      `${getThreadDisplayName(targetThread)} & ${getThreadDisplayName(sourceThread)}`
                    );
                  }}
                  className={`px-3 py-2 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                    titleMode === "combined"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-text-secondary hover:bg-background"
                  }`}
                >
                  <div className="text-[11px] opacity-70">Combine Both</div>
                  <div className="truncate font-semibold mt-0.5">
                    {getThreadDisplayName(targetThread)} & {getThreadDisplayName(sourceThread)}
                  </div>
                </button>

                <button
                  id="title-mode-custom"
                  type="button"
                  onClick={() => setTitleMode("custom")}
                  className={`px-3 py-2 text-xs rounded-lg border text-left transition-all cursor-pointer ${
                    titleMode === "custom"
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-text-secondary hover:bg-background"
                  }`}
                >
                  <div className="text-[11px] opacity-70">Custom Name</div>
                  <div className="truncate font-semibold mt-0.5">Type custom...</div>
                </button>
              </div>

              {titleMode === "custom" && (
                <input
                  id="custom-title-input"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter custom card title..."
                  className="w-full bg-background border border-border text-xs rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary mt-2"
                  autoFocus
                />
              )}
            </div>

            {/* Summary / Confirmation Box */}
            <div className="p-3.5 bg-background rounded-lg border border-border/80 text-xs text-text-secondary space-y-2">
              <div className="flex items-center gap-2 font-medium text-text-primary">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>After merging:</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-text-secondary">
                <li>
                  <strong className="text-text-primary">{sourceTaskCount} tasks</strong> from{" "}
                  <em>&ldquo;{getThreadDisplayName(sourceThread)}&rdquo;</em> will be merged into{" "}
                  <em>&ldquo;{getThreadDisplayName(targetThread)}&rdquo;</em> (total:{" "}
                  <strong className="text-text-primary">{totalTasksAfterMerge} tasks</strong>).
                </li>
                {sourceSessionCount > 0 && (
                  <li>
                    <strong className="text-text-primary">{sourceSessionCount} work sessions</strong>{" "}
                    will be combined (total:{" "}
                    <strong className="text-text-primary">{totalSessionsAfterMerge} sessions</strong>).
                  </li>
                )}
                <li>
                  Any board links connected to <em>&ldquo;{getThreadDisplayName(sourceThread)}&rdquo;</em> will be
                  automatically reconnected to the merged card.
                </li>
                <li>
                  The source card <em>&ldquo;{getThreadDisplayName(sourceThread)}&rdquo;</em> will be deleted.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
              <button
                id="cancel-merge-btn"
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-merge-btn"
                type="button"
                onClick={handleConfirmMerge}
                disabled={!sourceId || !targetId || sourceId === targetId}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Merge into &ldquo;{getThreadDisplayName(targetThread)}&rdquo;</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export const MergeThreadsModal: React.FC<MergeThreadsModalProps> = ({
  isOpen,
  onClose,
  initialSourceId,
  initialTargetId,
  threads,
  threadOrder,
  onMerge,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableThreads = useMemo(() => {
    return threadOrder
      .map((id) => threads[id])
      .filter((t): t is Thread => Boolean(t));
  }, [threads, threadOrder]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <MergeThreadsModalContent
          key="merge-threads-modal-content"
          onClose={onClose}
          initialSourceId={initialSourceId}
          initialTargetId={initialTargetId}
          threads={threads}
          threadOrder={threadOrder}
          availableThreads={availableThreads}
          onMerge={onMerge}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};
