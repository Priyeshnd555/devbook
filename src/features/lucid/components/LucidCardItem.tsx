"use client";

import React from "react";
import { Trash2, Link as LinkIcon, Unlink, Plus } from "lucide-react";
import { TaskItem, TaskItemProps } from "@features/tasks";
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
  onUpdateWidth: (id: string, width?: number) => void;
  taskItemProps: Omit<TaskItemProps, "task" | "threadId" | "level">;
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
  onUpdateWidth,
  taskItemProps,
  cardRef,
}) => {
  const localElRef = React.useRef<HTMLDivElement | null>(null);

  const handleRef = (el: HTMLDivElement | null) => {
    localElRef.current = el;
    cardRef(el);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const currentWidth = localElRef.current?.offsetWidth || card.width || 240;
    let newWidth = currentWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      newWidth = Math.max(220, Math.min(900, Math.round(currentWidth + deltaX)));
      if (localElRef.current) {
        localElRef.current.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      onUpdateWidth(card.id, newWidth);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleResizeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (localElRef.current) {
      localElRef.current.style.width = '';
    }
    onUpdateWidth(card.id, undefined);
  };

  const mirrorContent = card.content 
    ? (card.content.endsWith('\n') ? card.content + ' ' : card.content) 
    : "Thought...";

  return (
    <div
      ref={handleRef}
      onMouseDown={(e) => onMouseDown(e, card)}
      onClick={onCardClick}
      className={`absolute p-5 bg-surface border rounded-xl flex flex-col group min-w-[240px] max-w-[700px] w-fit
          ${isDragged ? 'z-50 shadow-2xl border-primary/40' : 'z-10 border-border shadow-sm hover:shadow-md hover:border-border/80'}
          ${isSource || isTarget ? 'border-primary z-40 scale-[1.02]' : ''}
          ${isDragged ? '' : 'transition-shadow transition-border duration-300'}
         `}
      style={{
        left: 0, top: 0,
        transform: `translate3d(${card.x}px, ${card.y}px, 0)`,
        width: card.width ? `${card.width}px` : undefined,
        cursor: linkingFromId ? 'crosshair' : (isDragged ? 'grabbing' : 'grab'),
        willChange: 'transform',
      }}
    >
      {/* Right Edge Resize Handle */}
      <div
        className="resize-handle absolute top-0 right-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-primary/10 rounded-r-xl"
        onMouseDown={handleResizeMouseDown}
        onDoubleClick={handleResizeDoubleClick}
        title="Drag to resize width (Double click to reset to auto)"
      >
        <div className="w-1 h-8 rounded-full bg-border group-hover:bg-primary/60 transition-colors" />
      </div>

      <div className="flex justify-between items-center mb-3 h-4 pointer-events-none">
        <div className="text-[9px] font-bold text-text-secondary/40 tracking-wider">
          {connCount > 0 && `${connCount} LINK${connCount > 1 ? 'S' : ''}`}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto pr-1">
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

      {/* Auto-expanding content area */}
      <div className="relative grid">
        <div 
          aria-hidden="true" 
          className="invisible italic font-sans text-lg leading-relaxed whitespace-pre-wrap break-words col-start-1 row-start-1 pointer-events-none p-0 min-h-[1.75rem]"
        >
          {mirrorContent}
        </div>
        <textarea
          className="col-start-1 row-start-1 w-full h-full bg-transparent resize-none border-none outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-text-primary font-sans italic text-lg placeholder:text-text-secondary/20 leading-relaxed cursor-text overflow-hidden"
          value={card.content}
          onChange={(e) => onUpdateContent(card.id, e.target.value)}
          autoFocus={card.content === ""}
          spellCheck={false}
          rows={1}
          placeholder="Thought..."
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
          <Plus className="w-3.5 h-3.5 text-text-secondary/40 group-hover/add:text-primary transition-colors flex-shrink-0" />
          <input
            type="text"
            placeholder="Add task..."
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none focus:ring-0 text-xs text-text-secondary placeholder:text-text-secondary/20"
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
