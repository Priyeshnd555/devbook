"use client";

import React, { useState, useMemo, useRef } from "react";
import { Trash2, Link as LinkIcon, Unlink, Plus, Clock, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { TaskItem, TaskItemProps } from "@features/tasks";
import { Task, ThreadStatus, THREAD_STATE_TRANSITIONS } from "@shared/types";
import {
  countAllTasks,
  countAllCompletedTasks,
  formatRelativeDate,
  formatFullDate,
  isTaskFullyCompleted,
  sortTasks,
} from "@shared/utils";
import { LucidCard } from "../types";

interface LucidCardItemProps {
  card: LucidCard;
  isDragged: boolean;
  isActive: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isSource: boolean;
  isTarget: boolean;
  connCount: number;
  linkingFromId: string | null;
  showCompleted: boolean;
  localShowCompleted?: boolean;
  onToggleLocalShowCompleted?: () => void;
  onMouseDown: (e: React.MouseEvent, card: LucidCard) => void;
  onCardClick: () => void;
  onUpdateContent: (id: string, content: string) => void;
  onUpdateStatus?: (id: string, status: ThreadStatus) => void;
  onDelete: (id: string) => void;
  onUnlink: (id: string) => void;
  onSetLinkingFrom: (id: string) => void;
  onUpdateTasks: (id: string, tasks: Task[]) => void;
  onUpdateDimensions: (id: string, width?: number, height?: number, x?: number, y?: number) => void;
  taskItemProps: Omit<TaskItemProps, "task" | "threadId" | "level">;
  cardRef: (el: HTMLDivElement | null) => void;
}

export const LucidCardItem: React.FC<LucidCardItemProps> = ({
  card,
  isDragged,
  isActive,
  isExpanded = true,
  onToggleExpand,
  isSource,
  isTarget,
  connCount,
  linkingFromId,
  showCompleted,
  localShowCompleted = false,
  onToggleLocalShowCompleted,
  onMouseDown,
  onCardClick,
  onUpdateContent,
  onUpdateStatus,
  onDelete,
  onUnlink,
  onSetLinkingFrom,
  onUpdateTasks,
  onUpdateDimensions,
  taskItemProps,
  cardRef,
}) => {
  const localElRef = useRef<HTMLDivElement | null>(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const handleRef = (el: HTMLDivElement | null) => {
    localElRef.current = el;
    cardRef(el);
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    direction: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = localElRef.current?.offsetWidth || card.width || 300;
    const startHeight = localElRef.current?.offsetHeight || card.height || 180;
    const startCardX = card.x;
    const startCardY = card.y;

    let finalWidth = startWidth;
    let finalHeight = startHeight;
    let finalX = startCardX;
    let finalY = startCardY;

    const MIN_WIDTH = 260;
    const MAX_WIDTH = 1200;
    const MIN_HEIGHT = 120;
    const MAX_HEIGHT = 1000;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      if (direction.includes("e")) {
        finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(startWidth + deltaX)));
        finalX = startCardX;
      } else if (direction.includes("w")) {
        const rawWidth = startWidth - deltaX;
        finalWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(rawWidth)));
        finalX = Math.round(startCardX + (startWidth - finalWidth));
      }

      if (direction.includes("s")) {
        finalHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(startHeight + deltaY)));
        finalY = startCardY;
      } else if (direction.includes("n")) {
        const rawHeight = startHeight - deltaY;
        finalHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(rawHeight)));
        finalY = Math.round(startCardY + (startHeight - finalHeight));
      }

      if (localElRef.current) {
        if (direction.includes("e") || direction.includes("w")) {
          localElRef.current.style.width = `${finalWidth}px`;
        }
        if (direction.includes("n") || direction.includes("s")) {
          localElRef.current.style.height = `${finalHeight}px`;
        }
        localElRef.current.style.transform = `translate3d(${finalX}px, ${finalY}px, 0)`;
      }
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      onUpdateDimensions(
        card.id,
        direction.includes("e") || direction.includes("w") ? finalWidth : card.width,
        direction.includes("n") || direction.includes("s") ? finalHeight : card.height,
        finalX,
        finalY
      );
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleResetDimensions = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (localElRef.current) {
      localElRef.current.style.width = "";
      localElRef.current.style.height = "";
    }
    onUpdateDimensions(card.id, undefined, undefined, card.x, card.y);
  };

  // Status configuration matching List view (ThreadCard)
  const statusConfig: Record<ThreadStatus, { bg: string; text: string; dot: string }> = {
    active: { bg: "bg-primary-light", text: "text-primary-text", dot: "bg-primary" },
    blocked: { bg: "bg-danger-bg", text: "text-danger-text", dot: "bg-danger" },
    completed: { bg: "bg-background", text: "text-text-secondary", dot: "bg-text-secondary" },
  };
  const currentStatus: ThreadStatus = card.status || "active";
  const statusStyle = statusConfig[currentStatus] || statusConfig.active;

  // Task filtering based on global and local showCompleted
  const finalShowCompleted = showCompleted || localShowCompleted;
  const totalTasks = useMemo(() => countAllTasks(card.tasks), [card.tasks]);
  const completedTasks = useMemo(() => countAllCompletedTasks(card.tasks), [card.tasks]);

  const visibleTasks = useMemo(() => {
    const sorted = sortTasks(card.tasks);
    if (finalShowCompleted) return sorted;
    return sorted.filter((task) => !isTaskFullyCompleted(task));
  }, [card.tasks, finalShowCompleted]);

  const zIndex = isDragged ? 1000 : isActive ? 250 : card.zIndex || 10;

  return (
    <div
      ref={handleRef}
      onMouseDown={(e) => onMouseDown(e, card)}
      onClick={onCardClick}
      className={`lucid-card absolute p-4 bg-surface border rounded-xl flex flex-col group min-w-[300px] max-w-[800px] w-fit
        ${isActive ? "border-primary/80 shadow-md ring-1 ring-primary/30" : "border-border shadow-2xs hover:shadow-sm hover:border-border/80"}
        ${isDragged ? "shadow-2xl border-primary/50 cursor-grabbing" : ""}
        ${isSource || isTarget ? "ring-1 ring-primary border-primary z-40" : ""}
        ${isDragged ? "" : "transition-all duration-200"}
      `}
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${card.x}px, ${card.y}px, 0)`,
        width: card.width ? `${card.width}px` : "fit-content",
        minWidth: "300px",
        maxWidth: "800px",
        height: isExpanded ? "fit-content" : "auto",
        minHeight: isExpanded && card.height ? `${card.height}px` : undefined,
        zIndex,
        cursor: linkingFromId ? "crosshair" : isDragged ? "grabbing" : "grab",
        willChange: "transform",
      }}
    >
      {/* Resize Handles - full 8 directions when expanded, left/right only when collapsed */}
      {isExpanded ? (
        <>
          <div
            className="resize-handle absolute top-0 left-3 right-3 h-2 cursor-ns-resize z-30 hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "n")}
            onDoubleClick={handleResetDimensions}
            title="Resize height (Double click to reset)"
          />
          <div
            className="resize-handle absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize z-30 hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "s")}
            onDoubleClick={handleResetDimensions}
            title="Resize height (Double click to reset)"
          />
          <div
            className="resize-handle absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize z-30 hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "w")}
            onDoubleClick={handleResetDimensions}
            title="Resize width (Double click to reset)"
          />
          <div
            className="resize-handle absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize z-30 hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "e")}
            onDoubleClick={handleResetDimensions}
            title="Resize width (Double click to reset)"
          />
          <div
            className="resize-handle absolute -top-1 -left-1 w-3.5 h-3.5 cursor-nwse-resize z-30 rounded-tl-lg hover:bg-primary/40 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
            onDoubleClick={handleResetDimensions}
            title="Resize (Double click to reset)"
          />
          <div
            className="resize-handle absolute -top-1 -right-1 w-3.5 h-3.5 cursor-nesw-resize z-30 rounded-tr-lg hover:bg-primary/40 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
            onDoubleClick={handleResetDimensions}
            title="Resize (Double click to reset)"
          />
          <div
            className="resize-handle absolute -bottom-1 -left-1 w-3.5 h-3.5 cursor-nesw-resize z-30 rounded-bl-lg hover:bg-primary/40 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
            onDoubleClick={handleResetDimensions}
            title="Resize (Double click to reset)"
          />
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 cursor-nwse-resize z-30 rounded-br-lg hover:bg-primary/40 transition-colors flex items-center justify-center"
            onMouseDown={(e) => handleResizeMouseDown(e, "se")}
            onDoubleClick={handleResetDimensions}
            title="Resize (Double click to reset)"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/80 transition-colors pointer-events-none" />
          </div>
        </>
      ) : (
        <>
          <div
            className="resize-handle absolute left-0 top-2 bottom-2 w-2 cursor-ew-resize z-30 hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "w")}
            onDoubleClick={handleResetDimensions}
            title="Resize width (Double click to reset)"
          />
          <div
            className="resize-handle absolute right-0 top-2 bottom-2 w-2 cursor-ew-resize z-30 hover:bg-primary/20 transition-colors"
            onMouseDown={(e) => handleResizeMouseDown(e, "e")}
            onDoubleClick={handleResetDimensions}
            title="Resize width (Double click to reset)"
          />
        </>
      )}

      {/* Top Header Row: Chevron Toggle, Thread Number, Status Dropdown, and Action Buttons */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          {onToggleExpand && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-0.5 rounded text-text-secondary/70 hover:text-primary hover:bg-background/80 transition-colors cursor-pointer"
              title={isExpanded ? "Close task card" : "Open task card"}
              aria-label={isExpanded ? "Close task card" : "Open task card"}
            >
              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          )}

          {card.threadNumber !== undefined && (
            <span
              className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-text-secondary/80 bg-background/80 rounded border border-border/40 select-none"
              title={`Task #${card.threadNumber}`}
            >
              #{card.threadNumber}
            </span>
          )}

          {/* Interactive Status Pill */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsStatusMenuOpen(!isStatusMenuOpen);
              }}
              onBlur={() => setTimeout(() => setIsStatusMenuOpen(false), 200)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium capitalize ${statusStyle.bg} shrink-0 cursor-pointer hover:opacity-90 transition-opacity`}
              title="Change task status"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
              <span className={`text-[11px] font-medium ${statusStyle.text}`}>
                {currentStatus}
              </span>
            </button>
            {isStatusMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-24 bg-surface rounded-md shadow-lg border border-border z-50 py-1">
                {(Object.keys(THREAD_STATE_TRANSITIONS) as ThreadStatus[]).map((s) => (
                  <button
                    key={s}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      onUpdateStatus?.(card.id, s);
                      setIsStatusMenuOpen(false);
                    }}
                    className="block w-full text-left px-2.5 py-1 text-xs text-text-primary hover:bg-background capitalize cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action icons & Link count */}
        <div className="flex items-center gap-2">
          {connCount > 0 && (
            <span className="text-[10px] font-bold text-text-secondary/70 tracking-wider">
              {connCount} LINK{connCount > 1 ? "S" : ""}
            </span>
          )}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {onToggleExpand && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="text-text-secondary/70 hover:text-primary transition-colors p-1 rounded hover:bg-background cursor-pointer"
                title={isExpanded ? "Close task card" : "Open task card"}
                aria-label={isExpanded ? "Close task card" : "Open task card"}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            )}
            {connCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlink(card.id);
                }}
                className="text-text-secondary/70 hover:text-danger transition-colors p-1 rounded hover:bg-background cursor-pointer"
                title="Unlink Task"
              >
                <Unlink size={13} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetLinkingFrom(card.id);
              }}
              className="text-text-secondary/70 hover:text-primary transition-colors p-1 rounded hover:bg-background cursor-pointer"
              title="Link to another task"
            >
              <LinkIcon size={13} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="text-text-secondary/70 hover:text-danger transition-colors p-1 rounded hover:bg-background cursor-pointer"
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-header Metadata Row: Date, Task Progress, and Hide/Show Completed Toggle */}
      <div className="flex items-center justify-between gap-2 text-xs text-text-secondary mb-3 px-0.5">
        <div className="flex items-center gap-3">
          {card.lastWorked && (
            <div
              className="flex items-center gap-1.5 text-[11px] text-text-secondary/80 shrink-0"
              title={`Last worked on: ${formatFullDate(card.lastWorked)}`}
            >
              <Clock className="w-3.5 h-3.5 text-text-secondary/70 shrink-0" />
              <span className="truncate max-w-[110px]">{formatRelativeDate(card.lastWorked)}</span>
            </div>
          )}

          {/* Progress Count & Bar */}
          <div
            className="flex items-center gap-1.5 text-[11px]"
            title={`Progress: ${completedTasks}/${totalTasks}`}
          >
            <span className="font-medium text-text-secondary/90">
              {completedTasks}/{totalTasks}
            </span>
            <div className="bg-border/60 rounded-full h-1.5 w-14 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Hide / Show completed tasks toggle */}
        {!showCompleted && onToggleLocalShowCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLocalShowCompleted();
            }}
            className="p-1 rounded text-text-secondary/60 hover:text-text-primary hover:bg-background/80 transition-colors focus:outline-none cursor-pointer"
            title={localShowCompleted ? "Hide completed tasks" : "Show completed tasks"}
          >
            {localShowCompleted ? (
              <Eye className="h-3.5 w-3.5 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Title / Thought: Notepad styling */}
      <div className="relative mb-2">
        <textarea
          className="w-full bg-transparent resize-none border-none outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-text-primary font-semibold text-base placeholder:text-text-secondary/40 leading-snug cursor-text overflow-hidden"
          value={card.content}
          onChange={(e) => {
            onUpdateContent(card.id, e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onFocus={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          rows={1}
          placeholder="Task title..."
        />
      </div>

      {/* Task List Section or Compact Closed Summary */}
      {isExpanded ? (
        <div className="pt-2 border-t border-border/20">
          <div className="space-y-0.5">
            {visibleTasks.map((task) => (
              <TaskItem
                key={`${card.id}-${task.id}`}
                {...taskItemProps}
                task={task}
                threadId={card.id}
                showCompleted={finalShowCompleted}
              />
            ))}
          </div>

          {/* Notepad-style Add Task line */}
          <div className="mt-2 flex items-center gap-2 group/add px-1 opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <Plus className="w-3.5 h-3.5 text-text-secondary/70 group-hover/add:text-primary transition-colors flex-shrink-0" />
            <input
              type="text"
              placeholder="Add task..."
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none text-xs text-text-primary placeholder:text-text-secondary/40 font-sans"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  const newTask: Task = {
                    id: crypto.randomUUID(),
                    text: e.currentTarget.value.trim(),
                    done: false,
                    note: "",
                    children: [],
                    priority: 0,
                    createdAt: Date.now(),
                    sortConfig: { direction: "desc" },
                  };
                  onUpdateTasks(card.id, [...card.tasks, newTask]);
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
        </div>
      ) : (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.();
          }}
          className="mt-1 py-1 px-2.5 rounded-lg bg-background/50 hover:bg-background border border-border/40 flex items-center justify-between text-xs text-text-secondary cursor-pointer transition-all hover:border-primary/40 group/closed"
          title="Click to open task list"
        >
          <span className="font-medium text-[11px] text-text-secondary">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
            {completedTasks > 0 && ` (${completedTasks} done)`}
          </span>
          <span className="text-primary font-medium text-[11px] flex items-center gap-1 group-hover/closed:translate-x-0.5 transition-transform">
            <span>Open</span>
            <ChevronRight size={12} />
          </span>
        </div>
      )}
    </div>
  );
};
