"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, X, AlertTriangle, Layers } from "lucide-react";
import { Thread } from "@shared/types";
import { countAllTasks } from "@shared/utils";

interface DeleteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  thread: Thread | null;
  threadNumber?: number;
}

export const DeleteCardModal: React.FC<DeleteCardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  thread,
  threadNumber,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!thread) return null;

  const totalTasks = countAllTasks(thread.tasks || []);
  const cardTitle =
    thread.title?.trim() ||
    (threadNumber !== undefined ? `Thread ${threadNumber}` : "Untitled Card");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="delete-card-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="bg-surface rounded-xl shadow-2xl border border-border w-full max-w-md overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-card-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-danger/10 text-danger">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2
                    id="delete-card-modal-title"
                    className="text-base font-semibold text-text-primary"
                  >
                    Delete Card
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <button
                id="close-delete-card-modal-btn"
                onClick={onClose}
                className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
              <div className="p-3.5 bg-background rounded-lg border border-border/80 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-medium text-text-primary leading-relaxed">
                    Are you sure you want to delete <strong className="text-primary font-semibold">&ldquo;{cardTitle}&rdquo;</strong>?
                  </p>
                  {totalTasks > 0 ? (
                    <p className="text-text-secondary flex items-center gap-1.5 pt-0.5">
                      <Layers className="w-3.5 h-3.5 text-text-secondary/70 shrink-0" />
                      <span>
                        This card contains <strong className="text-text-primary font-medium">{totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}</strong> that will be permanently removed.
                      </span>
                    </p>
                  ) : (
                    <p className="text-text-secondary">
                      This card contains no tasks and will be permanently removed.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-border bg-surface/50">
              <button
                id="cancel-delete-card-btn"
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-background border border-border rounded-lg transition-colors cursor-pointer"
                autoFocus
              >
                Cancel
              </button>
              <button
                id="confirm-delete-card-btn"
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-danger text-white text-xs font-semibold rounded-lg hover:bg-danger-hover transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Card</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
