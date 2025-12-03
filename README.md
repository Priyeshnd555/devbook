# Nested Workflow

A simple, nested task tracking application with context.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

*   **Nested Tasks**: Create tasks and nest them under each other to any depth.
*   **Notes**: Add notes to any task to provide more context.
*   **Task Status**: Mark tasks as complete or incomplete.
*   **Work Sessions**: Log work sessions to keep track of your progress.
*   **Expand/Collapse**: Collapse threads and tasks to focus on what's important.

## How it Works

The application is a single-page React application built with Next.js. It uses React's `useState` hook to manage the state of the tasks and threads.

*   **Threads**: The main container for a set of tasks. Each thread has a title, status, and a list of tasks.
*   **Tasks**: Each task has a description, a done status, a note, and a list of children tasks.
*   **State Management**: The entire state of the application is managed in the `NestedWorkflow` component. The state is passed down to the `ThreadCard` and `TaskItem` components as props.
*   **Actions**: Actions like adding, toggling, and updating tasks and notes are handled by functions in the `NestedWorkflow` component. These functions are passed down to the child components as props.



example: 
@AI_CODING_RULES.MD  @coding_guidelines.md  i want the total counts to be shown somewhere in @app/page.tsx make sure ui is      │
│   usable                                                                                                                          │
╰─────────────