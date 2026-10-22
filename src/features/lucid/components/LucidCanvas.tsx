"use client";

import React, { useState } from 'react';
import { LucidCardItem } from './LucidCardItem';
import { useLucidManager } from '../hooks/useLucidManager';
import { Task } from "@shared/types";
import { TaskItemProps } from "@features/tasks";

interface LucidCanvasProps {
  activeProjectId: string;
  showCompleted: boolean;
  taskItemProps: Omit<TaskItemProps, "task" | "threadId" | "level">;
}

const updateTaskInTree = (tasks: Task[], taskId: string, updater: (t: Task) => Task): Task[] => {
  return tasks.map(task => {
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
  taskItemProps,
}) => {
  const {
    folderCards,
    folderConnections,
    draggedCardId,
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
    updateCardWidth,
    cardRefs,
    connectionRefs,
  } = useLucidManager(activeProjectId);

  const canvasRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleAddCardEvent = () => addCard();
    window.addEventListener('lucid:addCard', handleAddCardEvent);
    return () => window.removeEventListener('lucid:addCard', handleAddCardEvent);
  }, [addCard]);

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
      setExpandedTasks(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
    },
    toggleTaskDone: (cardId: string, taskId: string) => {
      const card = folderCards.find(c => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({ 
        ...t, 
        done: !t.done, 
        completedAt: !t.done ? Date.now() : undefined 
      }));
      updateCardTasks(cardId, updated);
    },
    saveNote: (cardId: string, taskId: string, note: string) => {
      const card = folderCards.find(c => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({ ...t, note }));
      updateCardTasks(cardId, updated);
      setEditingNote(null);
    },
    addChild: (cardId: string, parentId: string) => {
      if (!newChildText.trim()) return;
      const card = folderCards.find(c => c.id === cardId);
      if (!card) return;
      const newTask: Task = {
        id: crypto.randomUUID(),
        text: newChildText.trim(),
        done: false,
        note: "",
        children: [],
        priority: 0,
        createdAt: Date.now()
      };
      const updated = updateTaskInTree(card.tasks, parentId, (t: Task) => ({ 
        ...t, 
        children: [...t.children, newTask] 
      }));
      updateCardTasks(cardId, updated);
      setAddingChildTo(null);
      setNewChildText("");
      setExpandedTasks(prev => new Set(prev).add(parentId));
    },
    updateTaskText: (cardId: string, taskId: string, text: string) => {
      const card = folderCards.find(c => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({ ...t, text }));
      updateCardTasks(cardId, updated);
      setEditingTaskId(null);
    },
    setTaskPriority: (cardId: string, taskId: string, priority: number) => {
      const card = folderCards.find(c => c.id === cardId);
      if (!card) return;
      const updated = updateTaskInTree(card.tasks, taskId, (t: Task) => ({ ...t, priority }));
      updateCardTasks(cardId, updated);
    },
  };

  return (
    <main
      ref={canvasRef}
      className="flex-1 relative overflow-hidden bg-background cursor-crosshair selection:bg-primary/20"
      onMouseUp={handleGlobalMouseUp}
      onMouseLeave={handleGlobalMouseUp}
      onDoubleClick={(e) => {
        if (e.target === canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          addCard("", e.clientX - rect.left - 150, e.clientY - rect.top - 100);
        }
      }}
    >
      <div className="absolute inset-0 z-0">
        <svg className="absolute inset-0 pointer-events-none z-0 w-full h-full overflow-visible">
          <defs>
            <marker id="arrowhead" markerWidth="9" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 9 3.5, 0 7" fill="currentColor" className="text-slate-700 dark:text-slate-300" />
            </marker>
          </defs>
          {folderConnections.map(conn => {
            const from = folderCards.find(c => c.id === conn.from);
            const to = folderCards.find(c => c.id === conn.to);
            if (!from || !to) return null;

            const fromWidth = from.width || 240;
            const toWidth = to.width || 240;
            const fromX = from.x + fromWidth / 2;
            const toX = to.x + toWidth / 2;
            const midX = (fromX + toX) / 2;
            const midY = (from.y + to.y + 60) / 2;

            return (
              <g key={conn.id} className="group pointer-events-auto">
                <line
                  ref={el => { connectionRefs.current[conn.id] = el }}
                  x1={fromX} y1={from.y + 30} x2={toX} y2={to.y + 30}
                  stroke="currentColor" strokeWidth="2"
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
          {folderCards.map(card => (
            <LucidCardItem
              key={card.id}
              card={card}
              cardRef={el => { cardRefs.current[card.id] = el }}
              isDragged={draggedCardId === card.id}
              isSource={linkingFromId === card.id}
              isTarget={proximityTargetId === card.id}
              connCount={folderConnections.filter(cn => cn.from === card.id || cn.to === card.id).length}
              linkingFromId={linkingFromId}
              showCompleted={showCompleted}
              onMouseDown={handleMouseDown}
              onCardClick={() => linkingFromId && linkingFromId !== card.id && (createConnection(linkingFromId, card.id), setLinkingFromId(null))}
              onUpdateContent={updateCardContent}
              onDelete={deleteCard}
              onUnlink={unlinkCard}
              onSetLinkingFrom={setLinkingFromId}
              onUpdateTasks={updateCardTasks}
              onUpdateWidth={updateCardWidth}
              taskItemProps={lucidTaskItemProps}
            />
          ))}
        </div>
      </div>
    </main>
  );
};
