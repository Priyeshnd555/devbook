// ============================================================================
// PURE HELPER FUNCTIONS: For calculations and data transformations.
// These are defined at the module level because they do not depend on any component state.
// PURPOSE: To centralize data manipulation logic, making it testable and
// reusable across the application. AI can easily understand these pure functions
// as they have no side effects.
// ============================================================================

import { Task, SortConfig } from '../types';

/**
 * STRATEGY: Recursion is used to locate an item within the nested structure and apply an update, maintaining immutability.
 * This function is pure and has no side effects.
 * @param tasks The array of tasks to search through.
 * @param taskId The ID of the task to update.
 * @param newDoneState Optional new 'done' state.
 * @param newText Optional new text.
 * @param newNote Optional new note.
 * @param newPriority Optional new priority.
 * @param newSortConfig Optional new sort config.
 * @returns A new array of tasks with the specified task updated.
 */
export const updateTaskRecursive = (tasks: Task[], taskId: string, newDoneState?: boolean, newText?: string, newNote?: string, newPriority?: number, newSortConfig?: SortConfig): Task[] => {
    return tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          done: newDoneState !== undefined ? newDoneState : task.done,
          text: newText !== undefined ? newText : task.text,
          note: newNote !== undefined ? newNote : task.note,
          priority: newPriority !== undefined ? newPriority : task.priority,
          sortConfig: newSortConfig !== undefined ? newSortConfig : task.sortConfig,
        };
      }
      if (task.children.length > 0) {
        return { ...task, children: updateTaskRecursive(task.children, taskId, newDoneState, newText, newNote, newPriority, newSortConfig) };
      }
      return task;
    });
};

/**
 * Recursively counts all tasks in a given array of tasks.
 * @param tasks The array of tasks to count.
 * @returns The total number of tasks and their descendants.
 */
export const countAllTasks = (tasks: Task[]): number => {
  return tasks.reduce((count, task) => {
      return count + 1 + countAllTasks(task.children);
  }, 0);
};

/**
 * Recursively counts all completed tasks in a given array of tasks.
 * @param tasks The array of tasks to count.
 * @returns The total number of completed tasks.
 */
export const countAllCompletedTasks = (tasks: Task[]): number => {
    return tasks.reduce((count, task) => {
        return count + (task.done ? 1 : 0) + countAllCompletedTasks(task.children);
    }, 0);
};

/**
 * STRATEGY: Recursively checks if a task and all of its descendants are marked as 'done'.
 * This is used for sorting, to ensure that only fully completed task trees are moved to the bottom.
 * @param task The task to check.
 * @returns True if the task and all its children are done, false otherwise.
 */
export const isTaskFullyCompleted = (task: Task): boolean => {
  if (!task.done) {
    return false;
  }
  if (task.children.length === 0) {
    return task.done;
  }
  return task.children.every(isTaskFullyCompleted);
};
