'use client'

import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Circle, CheckCircle2, Clock, MessageSquare, Zap, StickyNote, Pencil, Trash2 } from 'lucide-react';

const NestedWorkflow = () => {
  const [threads, setThreads] = useState({
    'dl-ios': {
      id: 'dl-ios',
      title: 'iOS Deeplink Implementation',
      status: 'active',
      lastWorked: '2025-11-28 11:30 AM',
      tasks: [
        {
          id: 't1',
          text: 'Test basic deeplinks on iOS',
          done: true,
          note: 'Working perfectly after assetlinks fix',
          children: []
        },
        {
          id: 't2',
          text: 'Test CMS page navigation',
          done: false,
          note: 'This is complex - multiple page types behave differently',
          children: [
            {
              id: 't2-1',
              text: 'Figure out which CMS pages exist in mobile',
              done: true,
              note: 'Found business-delivery page NOT in mobile app',
              children: []
            },
            {
              id: 't2-2',
              text: 'Check routing logic for CMS',
              done: false,
              note: 'Need to ask Sandeep about the logic here',
              children: [
                {
                  id: 't2-2-1',
                  text: 'Check Frontastic config',
                  done: false,
                  note: '',
                  children: []
                },
                {
                  id: 't2-2-2',
                  text: 'Review existing CMS navigation code',
                  done: false,
                  note: '',
                  children: []
                }
              ]
            }
          ]
        }
      ],
      sessions: [
        {
          date: '2025-11-28',
          time: '11:30 AM',
          notes: 'Working on CMS navigation - discovered multiple page types. Unclear routing.'
        }
      ]
    },
    'dl-android': {
      id: 'dl-android',
      title: 'Android Configuration Fix',
      status: 'blocked',
      lastWorked: '2025-11-27 10:30 AM',
      tasks: [
        {
          id: 'a1',
          text: 'Fix assetlinks.json',
          done: false,
          note: 'CRITICAL: PROD pointing to QA package',
          children: [
            {
              id: 'a1-1',
              text: 'Get server access',
              done: true,
              note: 'Requested from server team',
              children: []
            },
            {
              id: 'a1-2',
              text: 'Update package name to .prod',
              done: false,
              note: 'Waiting on server team - BLOCKED',
              children: []
            }
          ]
        }
      ],
      sessions: []
    }
  });

  const [expandedTasks, setExpandedTasks] = useState(new Set(['t2', 't2-2', 'a1']));
  const [expandedThreads, setExpandedThreads] = useState(new Set(Object.keys(threads)));
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingChildTo, setAddingChildTo] = useState(null);
  const [newChildText, setNewChildText] = useState('');
  const [addingSessionTo, setAddingSessionTo] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isAddingThread, setIsAddingThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [editingThreadId, setEditingThreadId] = useState(null);

  const addThread = () => {
    if (!newThreadTitle.trim()) return;
    const newThreadId = `thread-${Date.now()}`;
    const newThread = {
      id: newThreadId,
      title: newThreadTitle,
      status: 'active',
      lastWorked: new Date().toISOString().split('T')[0],
      tasks: [],
      sessions: [],
    };
    setThreads(prev => ({ ...prev, [newThreadId]: newThread }));
    setNewThreadTitle('');
    setIsAddingThread(false);
    setExpandedThreads(prev => new Set([...prev, newThreadId]));
  };

  const updateThreadTitle = (threadId, newTitle) => {
    setThreads(prev => ({
      ...prev,
      [threadId]: { ...prev[threadId], title: newTitle }
    }));
    setEditingThreadId(null);
  };

  const deleteThread = (threadId) => {
    if (window.confirm('Delete this thread?')) {
      const newThreads = { ...threads };
      delete newThreads[threadId];
      setThreads(newThreads);
    }
  };

  const toggleTask = (taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      newSet.has(taskId) ? newSet.delete(taskId) : newSet.add(taskId);
      return newSet;
    });
  };

  const toggleThread = (threadId) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      newSet.has(threadId) ? newSet.delete(threadId) : newSet.add(threadId);
      return newSet;
    });
  };

  const toggleTaskDone = (threadId, taskId) => {
    const updateTaskRecursive = (tasks) => {
      return tasks.map(task => {
        if (task.id === taskId) return { ...task, done: !task.done };
        if (task.children.length > 0) return { ...task, children: updateTaskRecursive(task.children) };
        return task;
      });
    };
    setThreads(prev => ({
      ...prev,
      [threadId]: { ...prev[threadId], tasks: updateTaskRecursive(prev[threadId].tasks) }
    }));
  };

  const saveNote = (threadId, taskId) => {
    const updateNoteRecursive = (tasks) => {
      return tasks.map(task => {
        if (task.id === taskId) return { ...task, note: noteText };
        if (task.children.length > 0) return { ...task, children: updateNoteRecursive(task.children) };
        return task;
      });
    };
    setThreads(prev => ({
      ...prev,
      [threadId]: { ...prev[threadId], tasks: updateNoteRecursive(prev[threadId].tasks) }
    }));
    setEditingNote(null);
    setNoteText('');
  };

  const addChild = (threadId, parentId) => {
    if (!newChildText.trim()) return;
    const addChildRecursive = (tasks) => {
      return tasks.map(task => {
        if (task.id === parentId) {
          const newId = `${parentId}-${task.children.length + 1}`;
          return {
            ...task,
            children: [...task.children, {
              id: newId,
              text: newChildText,
              done: false,
              note: '',
              children: []
            }]
          };
        }
        if (task.children.length > 0) return { ...task, children: addChildRecursive(task.children) };
        return task;
      });
    };
    setThreads(prev => ({
      ...prev,
      [threadId]: { ...prev[threadId], tasks: addChildRecursive(prev[threadId].tasks) }
    }));
    setExpandedTasks(prev => new Set([...prev, parentId]));
    setNewChildText('');
    setAddingChildTo(null);
  };

  const addSession = (threadId) => {
    if (!sessionNotes.trim()) return;
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setThreads(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        sessions: [{ date, time, notes: sessionNotes }, ...prev[threadId].sessions],
        lastWorked: `${date} ${time}`
      }
    }));
    setSessionNotes('');
    setAddingSessionTo(null);
  };

  const TaskItem = ({ task, threadId, level = 0 }) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children.length > 0;
    const isEditing = editingNote === task.id;
    const isAddingChild = addingChildTo === task.id;

    return (
      <div className={`${level > 0 ? 'ml-7 border-l border-orange-200 pl-4 py-0.5' : ''}`}>
        <div className="mb-1">
          <div className="flex items-start gap-3 group hover:bg-orange-50/30 px-3 py-2 rounded transition-colors">
            {hasChildren && (
              <button onClick={() => toggleTask(task.id)} className="mt-0.5 text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}
            {!hasChildren && <div className="w-4 flex-shrink-0"></div>}

            <button onClick={() => toggleTaskDone(threadId, task.id)} className="mt-0.5 flex-shrink-0 transition-colors">
              {task.done ? (
                <CheckCircle2 className="w-5 h-5 text-orange-400" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 hover:text-orange-300" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <span className={`text-sm leading-relaxed ${task.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {task.text}
              </span>
              
              {task.note && !isEditing && (
                <div 
                  className="mt-2 text-xs leading-relaxed text-orange-900 bg-orange-100 px-3 py-2 rounded cursor-pointer hover:bg-orange-100/80 transition-colors"
                  onClick={() => {
                    setEditingNote(task.id);
                    setNoteText(task.note);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-3 h-3 text-orange-700 mt-0.5 flex-shrink-0" />
                    <span>{task.note}</span>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded text-xs resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white leading-relaxed"
                    rows={3}
                    placeholder="Add notes..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveNote(threadId, task.id)}
                      className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingNote(null);
                        setNoteText('');
                      }}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              {!task.note && !isEditing && (
                <button
                  onClick={() => {
                    setEditingNote(task.id);
                    setNoteText(task.note);
                  }}
                  className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                  title="Add note"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setAddingChildTo(task.id)}
                className="p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                title="Add subtask"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {isAddingChild && (
            <div className="ml-10 mt-2 flex gap-2">
              <input
                type="text"
                value={newChildText}
                onChange={(e) => setNewChildText(e.target.value)}
                placeholder="New subtask..."
                className="flex-1 px-3 py-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && addChild(threadId, task.id)}
              />
              <button
                onClick={() => addChild(threadId, task.id)}
                className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors font-medium"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1">
            {task.children.map(child => (
              <TaskItem key={child.id} task={child} threadId={threadId} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ThreadCard = ({ thread, isThreadExpanded, toggleThread, onUpdateTitle, onDelete }) => {
    const completedCount = thread.tasks.filter(t => t.done).length;
    const totalCount = thread.tasks.length;
    const isAddingSession = addingSessionTo === thread.id;
    const [title, setTitle] = useState(thread.title);

    const handleUpdate = () => {
      if (title.trim()) onUpdateTitle(thread.id, title);
    };

    const statusConfig = {
      active: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
      blocked: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
      completed: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' }
    };
    const statusStyle = statusConfig[thread.status] || statusConfig.active;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 mb-4 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 group mb-3">
                <button onClick={() => toggleThread(thread.id)} className="text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0">
                  {isThreadExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {editingThreadId === thread.id ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleUpdate}
                    onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
                    className="text-base font-medium text-gray-900 flex-1 px-2 py-1 border-b-2 border-orange-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h3 className="text-base font-medium text-gray-900">{thread.title}</h3>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                  <button onClick={() => setEditingThreadId(thread.id)} className="p-1 text-gray-400 hover:text-orange-500 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(thread.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 ml-7">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{thread.lastWorked}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">{completedCount}/{totalCount}</span>
                  <div className="bg-gray-200 rounded-full h-1 w-16">
                    <div className="bg-orange-500 h-1 rounded-full transition-all" style={{ width: `${totalCount ? (completedCount/totalCount) * 100 : 0}%` }}></div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${statusStyle.bg} flex-shrink-0`}>
                  <div className={`w-1 h-1 rounded-full ${statusStyle.dot}`}></div>
                  <span className={`text-xs font-medium ${statusStyle.text}`}>{thread.status}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setAddingSessionTo(thread.id)}
              className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Log
            </button>
          </div>
        </div>

        {isAddingSession && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Work session</h4>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you work on?"
              className="w-full p-3 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => addSession(thread.id)}
                className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors font-medium"
              >
                Save
              </button>
              <button
                onClick={() => { setAddingSessionTo(null); setSessionNotes(''); }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isThreadExpanded && (
          <>
            <div className="p-4">
              <button
                onClick={() => setAddingChildTo(`${thread.id}-root`)}
                className="flex items-center gap-1.5 text-orange-600 hover:text-orange-700 text-xs font-medium mb-3 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add task
              </button>

              {addingChildTo === `${thread.id}-root` && (
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newChildText}
                    onChange={(e) => setNewChildText(e.target.value)}
                    placeholder="New task..."
                    className="flex-1 px-3 py-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newChildText.trim()) {
                        const newId = `t${thread.tasks.length + 1}`;
                        setThreads(prev => ({
                          ...prev,
                          [thread.id]: {
                            ...prev[thread.id],
                            tasks: [...prev[thread.id].tasks, {
                              id: newId,
                              text: newChildText,
                              done: false,
                              note: '',
                              children: []
                            }]
                          }
                        }));
                        setNewChildText('');
                        setAddingChildTo(null);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newChildText.trim()) {
                        const newId = `t${thread.tasks.length + 1}`;
                        setThreads(prev => ({
                          ...prev,
                          [thread.id]: {
                            ...prev[thread.id],
                            tasks: [...prev[thread.id].tasks, {
                              id: newId,
                              text: newChildText,
                              done: false,
                              note: '',
                              children: []
                            }]
                          }
                        }));
                        setNewChildText('');
                        setAddingChildTo(null);
                      }
                    }}
                    className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
              )}

              {thread.tasks.length > 0 ? (
                <div className="space-y-0.5">
                  {thread.tasks.map(task => (
                    <TaskItem key={task.id} task={task} threadId={thread.id} />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-400">
                  <p>No tasks. Add one to begin.</p>
                </div>
              )}
            </div>

            {thread.sessions.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <h4 className="text-xs font-medium text-gray-900 mb-2 uppercase tracking-wide">Sessions</h4>
                <div className="space-y-2">
                  {thread.sessions.map((session, idx) => (
                    <div key={idx} className="bg-gray-50 rounded p-2.5 text-xs border border-gray-200">
                      <div className="text-gray-500 mb-1 font-medium">
                        {session.date} {session.time}
                      </div>
                      <div className="text-gray-700 leading-relaxed">{session.notes}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow-xs z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-gray-900">Deep Linking Phase 2</h1>
              <p className="text-xs text-gray-500 mt-0.5">Nested task tracking</p>
            </div>
            <button
              onClick={() => setIsAddingThread(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded text-xs font-medium flex-shrink-0 hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-4">
        {isAddingThread && (
          <div className="mb-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 mb-2">New thread</h3>
            <input
              type="text"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Title..."
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              autoFocus
              onKeyPress={(e) => e.key === 'Enter' && addThread()}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={addThread}
                className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors font-medium"
              >
                Create
              </button>
              <button
                onClick={() => { setIsAddingThread(false); setNewThreadTitle(''); }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {Object.values(threads).map(thread => (
            <ThreadCard 
              key={thread.id} 
              thread={thread} 
              isThreadExpanded={expandedThreads.has(thread.id)}
              toggleThread={toggleThread}
              onUpdateTitle={updateThreadTitle}
              onDelete={deleteThread}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NestedWorkflow;