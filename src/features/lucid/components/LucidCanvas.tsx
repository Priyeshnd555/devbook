"use client";

import React, { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { LucidCardItem } from "./LucidCardItem";
import { useLucidManager } from "../hooks/useLucidManager";
import { Task, Thread, ThreadConnection, ThreadStatus } from "@shared/types";
import { TaskItemProps } from "@features/tasks";

interface LucidCanvasProps {
  activeProjectId: string;
  showCompleted: boolean;
  localShowCompleted?: Record<string, boolean>;
  onToggleLocalShowCompleted?: (id: string) => void;
  taskItemProps: Omit<TaskItemProps, "task" | "threadId" | "level">;
  threads?: Record<string, Thread>;
  connections?: ThreadConnection[];
  expandedThreads?: Set<string>;
  onToggleThread?: (id: string) => void;
  onAddThread?: (title?: string, x?: number, y?: number) => void;
  onUpdateThreadPosition?: (id: string, x: number, y: number) => void;
  onUpdateThreadDimensions?: (id: string, width?: number, height?: number, x?: number, y?: number) => void;
  onUpdateThreadTitle?: (id: string, title: string) => void;
  onUpdateThreadStatus?: (id: string, status: ThreadStatus) => void;
  onUpdateThreadTasks?: (id: string, tasks: Task[]) => void;
  onDeleteThread?: (id: string) => void;
  onUnlinkThread?: (id: string) => void;
  onCreateConnection?: (fromId: string, toId: string) => void;
  onRemoveConnection?: (id: string) => void;
}

const updateTaskInTree = (tasks: Task[], taskId: string, updater: (t: Task) => Task): Task[] => {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return updater(task);
    }
    if (task.children.length > 0) {
      return { ...task, children: updateTaskInTree(task.children, taskId, updater) };
    }
    return task;
  });
};

export const LucidCanvas: React.FC<LucidCanvasProps> = ({
  activeProjectId,
  showCompleted,
  localShowCompleted,
  onToggleLocalShowCompleted,
  taskItemProps,
  threads,
  connections,
  expandedThreads,
  onToggleThread,
  onAddThread,
  onUpdateThreadPosition,
  onUpdateThreadDimensions,
  onUpdateThreadTitle,
  onUpdateThreadStatus,
  onUpdateThreadTasks,
  onDeleteThread,
  onUnlinkThread,
  onCreateConnection,
  onRemoveConnection,
}) => {
  const {
    folderCards,
    folderConnections,
    draggedCardId,
    activeCardId,
    setActiveCardId,
    bringCardToFront,
    linkingFromId,
    proximityTargetId,
    setLinkingFromId,
    handleMouseDown,
    handleGlobalMouseUp,
    addCard,
    updateCardContent,
    deleteCard,
    unlinkCard,
    createConnection,
    removeConnection,
    updateCardTasks,
    updateCardStatus,
    updateCardDimensions,
    autoArrangeCards,
    cardRefs,
    connectionRefs,
  } = useLucidManager(activeProjectId, threads, connections, {
    addThread: onAddThread,
    updateThreadPosition: onUpdateThreadPosition,
    updateThreadDimensions: onUpdateThreadDimensions,
    updateThreadTitle: onUpdateThreadTitle,
    updateThreadStatus: onUpdateThreadStatus,
    updateThreadTasks: onUpdateThreadTasks,
    deleteThread: onDeleteThread,
    unlinkThread: onUnlinkThread,
    createConnection: onCreateConnection,
    removeConnection: onRemoveConnection,
  });

  const canvasRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleAddCardEvent = () => addCard();
    const handleAutoArrangeEvent = () => autoArrangeCards();
    window.addEventListener("lucid:addCard", handleAddCardEvent);
    window.addEventListener("lucid:autoArrange", handleAutoArrangeEvent);
    return () => {
      window.removeEventListener("lucid:addCard", handleAddCardEvent);
      window.removeEventListener("lucid:autoArrange", handleAutoArrangeEvent);
    };
  }, [addCard, autoArrangeCards]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If click didn't originate inside a card, clear active card focus
    if (!(e.target as HTMLElement).closest(".lucid-card")) {
      setActiveCardId(null);
    }
  };

  // --- Local Task Logic Mapping ---
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTaskText, setEditedTaskText] = useState<string>("");
  const [newChildText, setNewChildText] = useState<string>("");

  const lucidTaskItemProps = {
    ...taskItemProps,
    expandedTasks,
    editingNote,
    addingChildTo,
    editingTaskId,
    editedTaskText,
    setEditingNote,
    setAddingChildTo,
    newChildText,
    setNewChildText,
    setEditingTaskId,
    setEditedTaskText,
    toggleTask: (taskId: string) => {
      setExpandedTasks((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
    },
    toggleTaskDone: (cardId: string, taskId: string) => {
      const card = folderCards.find((c) => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({
        ...t,
        done: !t.done,
        completedAt: !t.done ? Date.now() : undefined,
      }));
      updateCardTasks(cardId, updated);
    },
    saveNote: (cardId: string, taskId: string, note: string) => {
      const card = folderCards.find((c) => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({ ...t, note }));
      updateCardTasks(cardId, updated);
    },
    addChild: (cardId: string, parentId: string) => {
      if (!newChildText.trim()) return;
      const card = folderCards.find((c) => c.id === cardId);
      if (!card) return;
      const newTask: Task = {
        id: crypto.randomUUID(),
        text: newChildText.trim(),
        done: false,
        note: "",
        children: [],
        priority: 0,
        createdAt: Date.now(),
      };
      const updated = updateTaskInTree(card.tasks, parentId, (t: Task) => ({
        ...t,
        children: [...t.children, newTask],
      }));
      updateCardTasks(cardId, updated);
      setAddingChildTo(null);
      setNewChildText("");
      setExpandedTasks((prev) => new Set(prev).add(parentId));
    },
    updateTaskText: (cardId: string, taskId: string, text: string) => {
      const card = folderCards.find((c) => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({ ...t, text }));
      updateCardTasks(cardId, updated);
      setEditingTaskId(null);
    },
    setTaskPriority: (cardId: string, taskId: string, priority: number) => {
      const card = folderCards.find((c) => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({ ...t, priority }));
      updateCardTasks(cardId, updated);
    },
  };

  // Track cards collapsed in canvas view
  const [collapsedCardIds, setCollapsedCardIds] = useState<Set<string>>(new Set());

  const handleToggleCardExpand = (cardId: string) => {
    setCollapsedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
    onToggleThread?.(cardId);
  };

  // Dynamic Canvas bounds to ensure all cards (even far down or right) can be scrolled to
  const canvasBounds = React.useMemo(() => {
    let maxX = 1800;
    let maxY = 1200;
    folderCards.forEach((c) => {
      const cardWidth = c.width || 340;
      const cardHeight = c.height || 360;
      if (c.x + cardWidth + 500 > maxX) {
        maxX = c.x + cardWidth + 500;
      }
      if (c.y + cardHeight + 600 > maxY) {
        maxY = c.y + cardHeight + 600;
      }
    });
    return { width: maxX, height: maxY };
  }, [folderCards]);

  return (
    <main
      ref={canvasRef}
      className="flex-1 relative overflow-auto no-scrollbar bg-background cursor-crosshair selection:bg-primary/20 h-full w-full"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseUp={handleGlobalMouseUp}
      onMouseLeave={handleGlobalMouseUp}
      onDoubleClick={(e) => {
        if (
          e.target === canvasRef.current ||
          (e.target as HTMLElement).classList.contains("lucid-canvas-bg")
        ) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const scrollLeft = canvasRef.current?.scrollLeft || 0;
            const scrollTop = canvasRef.current?.scrollTop || 0;
            addCard("", e.clientX - rect.left + scrollLeft - 150, e.clientY - rect.top + scrollTop - 100);
          }
        }
      }}
    >
      <div
        className="lucid-canvas-bg relative"
        style={{
          width: `${canvasBounds.width}px`,
          height: `${canvasBounds.height}px`,
          minWidth: "100%",
          minHeight: "100%",
        }}
      >
        <svg
          className="absolute inset-0 pointer-events-none z-0 overflow-visible"
          style={{ width: `${canvasBounds.width}px`, height: `${canvasBounds.height}px` }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon
                points="0 0, 9 3.5, 0 7"
                fill="currentColor"
                className="text-slate-700 dark:text-slate-300"
              />
            </marker>
          </defs>
          {folderConnections.map((conn) => {
            const from = folderCards.find((c) => c.id === conn.from);
            const to = folderCards.find((c) => c.id === conn.to);
            if (!from || !to) return null;

            const fromWidth = from.width || 300;
            const toWidth = to.width || 300;
            const fromX = from.x + fromWidth / 2;
            const toX = to.x + toWidth / 2;
            const midX = (fromX + toX) / 2;
            const midY = (from.y + to.y + 60) / 2;

            return (
              <g key={conn.id} className="group pointer-events-auto">
                <line
                  ref={(el) => {
                    connectionRefs.current[conn.id] = el;
                  }}
                  x1={fromX}
                  y1={from.y + 30}
                  x2={toX}
                  y2={to.y + 30}
                  stroke="currentColor"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  className="text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors"
                />
                <circle
                  cx={midX}
                  cy={midY}
                  r="12"
                  fill="var(--color-surface)"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-slate-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 cursor-pointer shadow-md transition-all hover:text-danger hover:scale-110"
                  onClick={() => removeConnection(conn.id)}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  className="pointer-events-none opacity-0 group-hover:opacity-100 fill-slate-700 dark:fill-slate-300 font-bold text-xs"
                >
                  ×
                </text>
              </g>
            );
          })}
        </svg>

        <div className="w-full h-full relative">
          {folderCards.map((card) => (
            <LucidCardItem
              key={card.id}
              card={card}
              cardRef={(el) => {
                cardRefs.current[card.id] = el;
              }}
              isDragged={draggedCardId === card.id}
              isActive={activeCardId === card.id}
              isExpanded={!collapsedCardIds.has(card.id)}
              onToggleExpand={() => handleToggleCardExpand(card.id)}
              isSource={linkingFromId === card.id}
              isTarget={proximityTargetId === card.id}
              connCount={
                folderConnections.filter((cn) => cn.from === card.id || cn.to === card.id).length
              }
              linkingFromId={linkingFromId}
              showCompleted={showCompleted}
              localShowCompleted={localShowCompleted?.[card.id] ?? false}
              onToggleLocalShowCompleted={() => onToggleLocalShowCompleted?.(card.id)}
              onMouseDown={handleMouseDown}
              onCardClick={() => {
                bringCardToFront(card.id);
                if (linkingFromId && linkingFromId !== card.id) {
                  createConnection(linkingFromId, card.id);
                  setLinkingFromId(null);
                }
              }}
              onUpdateContent={updateCardContent}
              onUpdateStatus={updateCardStatus}
              onDelete={deleteCard}
              onUnlink={unlinkCard}
              onSetLinkingFrom={setLinkingFromId}
              onUpdateTasks={updateCardTasks}
              onUpdateDimensions={updateCardDimensions}
              taskItemProps={lucidTaskItemProps}
            />
          ))}
        </div>
      </div>
    </main>
  );
};
