"use client";

import React, { useState } from 'react';
import { Lightbulb, Lock, X } from 'lucide-react';
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
    activeCommitment,
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
    setCommitment,
    clearCommitment,
    cardRefs,
    connectionRefs,
  } = useLucidManager(activeProjectId);

  const canvasRef = React.useRef<HTMLDivElement | null>(null);

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
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="currentColor" className="text-border" />
            </marker>
          </defs>
          {folderConnections.map(conn => {
            const from = folderCards.find(c => c.id === conn.from);
            const to = folderCards.find(c => c.id === conn.to);
            if (!from || !to) return null;

            return (
              <g key={conn.id} className="group pointer-events-auto">
                <line
                  ref={el => { connectionRefs.current[conn.id] = el }}
                  x1={from.x + 110} y1={from.y + 30} x2={to.x + 110} y2={to.y + 30}
                  stroke="currentColor" strokeWidth="1"
                  markerEnd="url(#arrowhead)"
                  className="text-border opacity-30 group-hover:opacity-80 transition-opacity"
                />
                <circle 
                  cx={(from.x + to.x + 220) / 2} 
                  cy={(from.y + to.y + 60) / 2} 
                  r="12" fill="var(--color-surface)" 
                  stroke="currentColor" 
                  className="text-border opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm transition-all" 
                  onClick={() => removeConnection(conn.id)} 
                />
                <text 
                  x={(from.x + to.x + 220) / 2} 
                  y={(from.y + to.y + 60) / 2 + 4} 
                  textAnchor="middle" 
                  className="pointer-events-none opacity-0 group-hover:opacity-100 fill-text-secondary font-bold text-[10px]"
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
              taskItemProps={lucidTaskItemProps}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-xl z-40 px-6">
        <div className="bg-surface border border-border rounded-lg p-6 flex items-center gap-6">
          {activeCommitment ? (
            <div className="flex-1 flex items-center gap-6">
              <div className="w-10 h-10 border border-primary/40 rounded flex items-center justify-center text-primary">
                <Lock size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-medium text-text-secondary/40 uppercase tracking-widest mb-1">Final Goal</p>
                <p className="text-text-primary font-medium text-lg truncate tracking-tight">{activeCommitment.content}</p>
              </div>
              <button onClick={clearCommitment} className="p-2 text-text-secondary/20 hover:text-danger transition-all"><X size={16} /></button>
            </div>
          ) : (
            <form className="flex-1 flex items-center gap-6" onSubmit={(e) => {
              e.preventDefault();
              const val = (e.currentTarget.elements.namedItem('goal') as HTMLInputElement).value;
              if (val) setCommitment(val);
              e.currentTarget.reset();
            }}>
              <div className="w-10 h-10 flex items-center justify-center text-primary/20">
                <Lightbulb size={24} />
              </div>
              <input name="goal" autoComplete="off" placeholder="What's the goal?"
                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-lg font-light text-text-primary placeholder:text-text-secondary/10 font-sans" />
              <button type="submit" className="text-text-secondary border border-border px-6 py-2 rounded text-[10px] font-medium uppercase tracking-widest hover:bg-surface transition-all">Activate</button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};
