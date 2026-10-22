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
  onUpdateDimensions: (id: string, width?: number, height?: number, x?: number, y?: number) => void;
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
  onUpdateDimensions,
  taskItemProps,
  cardRef,
}) => {
  const localElRef = React.useRef<HTMLDivElement | null>(null);

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
    const startWidth = localElRef.current?.offsetWidth || card.width || 240;
    const startHeight = localElRef.current?.offsetHeight || card.height || 160;
    const startCardX = card.x;
    const startCardY = card.y;

    let finalWidth = startWidth;
    let finalHeight = startHeight;
    let finalX = startCardX;
    let finalY = startCardY;

    const MIN_WIDTH = 220;
    const MAX_WIDTH = 1200;
    const MIN_HEIGHT = 100;
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
        height: card.height ? `${card.height}px` : undefined,
        cursor: linkingFromId ? 'crosshair' : (isDragged ? 'grabbing' : 'grab'),
        willChange: 'transform',
      }}
    >
      {/* 8-Directional Resize Handles */}
      {/* Top Edge */}
      <div
        className="resize-handle absolute top-0 left-3 right-3 h-2 cursor-ns-resize z-30 hover:bg-primary/20 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
        onDoubleClick={handleResetDimensions}
        title="Resize height (Double click to reset)"
      />
      {/* Bottom Edge */}
      <div
        className="resize-handle absolute bottom-0 left-3 right-3 h-2 cursor-ns-resize z-30 hover:bg-primary/20 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
        onDoubleClick={handleResetDimensions}
        title="Resize height (Double click to reset)"
      />
      {/* Left Edge */}
      <div
        className="resize-handle absolute left-0 top-3 bottom-3 w-2 cursor-ew-resize z-30 hover:bg-primary/20 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
        onDoubleClick={handleResetDimensions}
        title="Resize width (Double click to reset)"
      />
      {/* Right Edge */}
      <div
        className="resize-handle absolute right-0 top-3 bottom-3 w-2 cursor-ew-resize z-30 hover:bg-primary/20 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
        onDoubleClick={handleResetDimensions}
        title="Resize width (Double click to reset)"
      />
      {/* Top-Left Corner */}
      <div
        className="resize-handle absolute -top-1 -left-1 w-3.5 h-3.5 cursor-nwse-resize z-30 rounded-tl-lg hover:bg-primary/40 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
        onDoubleClick={handleResetDimensions}
        title="Resize (Double click to reset)"
      />
      {/* Top-Right Corner */}
      <div
        className="resize-handle absolute -top-1 -right-1 w-3.5 h-3.5 cursor-nesw-resize z-30 rounded-tr-lg hover:bg-primary/40 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
        onDoubleClick={handleResetDimensions}
        title="Resize (Double click to reset)"
      />
      {/* Bottom-Left Corner */}
      <div
        className="resize-handle absolute -bottom-1 -left-1 w-3.5 h-3.5 cursor-nesw-resize z-30 rounded-bl-lg hover:bg-primary/40 transition-colors"
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
        onDoubleClick={handleResetDimensions}
        title="Resize (Double click to reset)"
      />
      {/* Bottom-Right Corner */}
      <div
        className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 cursor-nwse-resize z-30 rounded-br-lg hover:bg-primary/40 transition-colors flex items-center justify-center"
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
        onDoubleClick={handleResetDimensions}
        title="Resize (Double click to reset)"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary/80 transition-colors pointer-events-none" />
      </div>

      <div className="flex justify-between items-center mb-3 h-4 pointer-events-none">
        <div className="text-[9px] font-bold text-text-secondary/70 tracking-wider">
          {connCount > 0 && `${connCount} LINK${connCount > 1 ? 'S' : ''}`}
        </div>
        <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-auto pr-1">
          {connCount > 0 && (
            <button 
              onClick={(e) => { e.stopPropagation(); onUnlink(card.id); }} 
              className="text-text-secondary/70 hover:text-danger transition-colors p-0.5" 
              title="Unlink Card"
            >
              <Unlink size={13} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onSetLinkingFrom(card.id); }} 
            className="text-text-secondary/70 hover:text-primary transition-colors p-0.5" 
            title="Link Card"
          >
            <LinkIcon size={13} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} 
            className="text-text-secondary/70 hover:text-danger transition-colors p-0.5" 
            title="Delete Card"
          >
            <Trash2 size={13} />
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
          className="col-start-1 row-start-1 w-full h-full bg-transparent resize-none border-none outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-text-primary font-sans italic text-lg placeholder:text-text-secondary/30 leading-relaxed cursor-text overflow-hidden"
          value={card.content}
          onChange={(e) => onUpdateContent(card.id, e.target.value)}
          autoFocus={card.content === ""}
          spellCheck={false}
          rows={1}
          placeholder="Thought..."
        />
      </div>

      <div className="mt-4 pt-4 border-t border-border/10 flex-1 overflow-y-auto [scrollbar-width:thin]">
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
          <Plus className="w-3.5 h-3.5 text-text-secondary/70 group-hover/add:text-primary transition-colors flex-shrink-0" />
          <input
            type="text"
            placeholder="Add task..."
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none focus:ring-0 text-xs text-text-secondary placeholder:text-text-secondary/30"
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
