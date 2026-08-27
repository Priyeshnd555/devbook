"use client";

import React from "react";
import { Trash2, Link as LinkIcon, Unlink, Plus } from "lucide-react";
import { TaskItem } from "@features/tasks";
import { Task } from "@shared/types";
import { LucidCard } from "../types";

interface LucidCardItemProps {
  card: LucidCard;
  isDragged: boolean;
  isSource: boolean;
  isTarget: boolean;
  connCount: number;
  linkingFromId: string | null;
  showCompleted: boolean;
  onMouseDown: (e: React.MouseEvent, card: LucidCard) => void;
  onCardClick: () => void;
  onUpdateContent: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onUnlink: (id: string) => void;
  onSetLinkingFrom: (id: string) => void;
  onUpdateTasks: (id: string, tasks: Task[]) => void;
  taskItemProps: any; // Simplified for this component
  cardRef: (el: HTMLDivElement | null) => void;
}

export const LucidCardItem: React.FC<LucidCardItemProps> = ({
  card,
  isDragged,
  isSource,
  isTarget,
  connCount,
  linkingFromId,
  showCompleted,
  onMouseDown,
  onCardClick,
  onUpdateContent,
  onDelete,
  onUnlink,
  onSetLinkingFrom,
  onUpdateTasks,
  taskItemProps,
  cardRef,
}) => {
  return (
    <div
      ref={cardRef}
      onMouseDown={(e) => onMouseDown(e, card)}
      onClick={onCardClick}
      className={`absolute p-6 w-[260px] bg-surface border rounded flex flex-col group
          ${isDragged ? 'z-50 shadow-md border-primary/20' : 'z-10 border-border shadow-none hover:border-text-secondary/20'}
          ${isSource || isTarget ? 'border-primary z-40' : ''}
          ${isDragged ? '' : 'transition-all duration-300'}
         `}
      style={{
        left: 0, top: 0,
        transform: `translate3d(${card.x}px, ${card.y}px, 0)`,
        cursor: linkingFromId ? 'crosshair' : (isDragged ? 'grabbing' : 'grab'),
        willChange: 'transform',
      }}
    >
      <div className="flex justify-between items-center mb-3 h-4 pointer-events-none">
        <div className="text-[9px] font-bold text-text-secondary/40 tracking-wider">
          {connCount > 0 && `${connCount} LINK${connCount > 1 ? 'S' : ''}`}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
          {connCount > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onUnlink(card.id); }} 
              className="text-text-secondary/40 hover:text-danger transition-colors" 
              title="Unlink Card"
            >
              <Unlink size={12} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onSetLinkingFrom(card.id); }} 
            className="text-text-secondary/40 hover:text-primary transition-colors" 
            title="Link Card"
          >
            <LinkIcon size={12} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} 
            className="text-text-secondary/40 hover:text-danger transition-colors" 
            title="Delete Card"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="relative">
        <textarea
          className="w-full bg-transparent resize-none border-none outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-text-primary font-sans text-lg placeholder:text-text-secondary/10 leading-relaxed cursor-text overflow-hidden"
          value={card.content}
          onChange={(e) => {
            onUpdateContent(card.id, e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          autoFocus={card.content === ""}
          spellCheck={false}
          rows={1}
          placeholder="..."
        />
      </div>

      <div className="mt-4 pt-4 border-t border-border/10">
        <div className="space-y-1">
          {card.tasks.map((task) => (
            <TaskItem
              key={`${card.id}-${task.id}`}
              {...taskItemProps}
              task={task}
              threadId={card.id}
              showCompleted={showCompleted}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 group/add px-1">
          <Plus className="w-3.5 h-3.5 text-text-secondary/40 group-hover/add:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Add task..."
            className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-text-secondary placeholder:text-text-secondary/20"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                const newTask: Task = {
                  id: crypto.randomUUID(),
                  text: e.currentTarget.value.trim(),
                  done: false,
                  note: "",
                  children: [],
                  priority: 0,
                  createdAt: Date.now(),
                  sortConfig: { direction: 'desc' }
                };
                onUpdateTasks(card.id, [...card.tasks, newTask]);
                e.currentTarget.value = "";
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
