'use client'

import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Circle, CheckCircle2, Clock, MessageSquare, Zap, StickyNote } from 'lucide-react';

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
            },
            {
              id: 't2-3',
              text: 'Test each CMS page type',
              done: false,
              note: 'Some open webview, some native - very unclear!',
              children: [
                {
                  id: 't2-3-1',
                  text: 'Static pages',
                  done: false,
                  note: '',
                  children: []
                },
                {
                  id: 't2-3-2',
                  text: 'Dynamic pages',
                  done: false,
                  note: '',
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 't3',
          text: 'Validate all external links',
          done: false,
          note: 'Check ALL, not just the ones mentioned in tickets',
          children: [
            {
              id: 't3-1',
              text: 'Sweepstakes link (ATGR-17336)',
              done: false,
              note: 'Goes to 404 - needs to open external browser',
              children: []
            },
            {
              id: 't3-2',
              text: 'Browse URLs',
              done: false,
              note: 'qa.shopmyexchange.com/browse?query=tap not working',
              children: []
            },
            {
              id: 't3-3',
              text: 'Privacy policy links',
              done: false,
              note: 'Need to move to Firebase config',
              children: []
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
            },
            {
              id: 'a1-3',
              text: 'Verify with Google tool',
              done: false,
              note: 'Use developers.google.com/digital-asset-links/tools/generator',
              children: []
            }
          ]
        }
      ],
      sessions: [
        {
          date: '2025-11-27',
          time: '10:30 AM',
          notes: 'Found root cause! Package name wrong in both Android and iOS configs.'
        }
      ]
    }
  });

  const [expandedTasks, setExpandedTasks] = useState(new Set(['t2', 't2-2', 't3', 'a1']));
  const [expandedThreads, setExpandedThreads] = useState(new Set(Object.keys(threads)));
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [addingChildTo, setAddingChildTo] = useState(null);
  const [newChildText, setNewChildText] = useState('');
  const [addingSessionTo, setAddingSessionTo] = useState(null);
  const [sessionNotes, setSessionNotes] = useState('');

  const toggleTask = (taskId) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleThread = (threadId) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const toggleTaskDone = (threadId, taskId) => {
    const updateTaskRecursive = (tasks) => {
      return tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, done: !task.done };
        }
        if (task.children.length > 0) {
          return { ...task, children: updateTaskRecursive(task.children) };
        }
        return task;
      });
    };

    setThreads(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: updateTaskRecursive(prev[threadId].tasks)
      }
    }));
  };

  const saveNote = (threadId, taskId) => {
    const updateNoteRecursive = (tasks) => {
      return tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, note: noteText };
        }
        if (task.children.length > 0) {
          return { ...task, children: updateNoteRecursive(task.children) };
        }
        return task;
      });
    };

    setThreads(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: updateNoteRecursive(prev[threadId].tasks)
      }
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
        if (task.children.length > 0) {
          return { ...task, children: addChildRecursive(task.children) };
        }
        return task;
      });
    };

    setThreads(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        tasks: addChildRecursive(prev[threadId].tasks)
      }
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
        sessions: [{
          date,
          time,
          notes: sessionNotes
        }, ...prev[threadId].sessions],
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
      <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
        <div className="mb-2">
          <div className="flex items-start gap-2 group hover:bg-gray-50 p-2 rounded-lg">
            {/* Expand/Collapse */}
            {hasChildren && (
              <button
                onClick={() => toggleTask(task.id)}
                className="mt-0.5 text-gray-400 hover:text-gray-600"
              >
                {isExpanded ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
              </button>
            )}
            {!hasChildren && <div className="w-4"></div>}

            {/* Checkbox */}
            <button
              onClick={() => toggleTaskDone(threadId, task.id)}
              className="mt-0.5"
            >
              {task.done ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 hover:text-gray-400" />
              )}
            </button>

            {/* Task Text */}
            <div className="flex-1 min-w-0">
              <span className={`${task.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.text}
              </span>
              
              <span className="text-xs text-gray-400"> {task.addedDate}  2018:04:01 </span>
              
              {/* Note Preview */}
              {task.note && !isEditing && (
                <div 
                  className="mt-1 text-sm text-gray-600 bg-amber-50 border-l-2 border-amber-400 px-3 py-1.5 rounded cursor-pointer hover:bg-amber-100"
                  onClick={() => {
                    setEditingNote(task.id);
                    setNoteText(task.note);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                    <span>{task.note}</span>
                  </div>
                </div>
              )}

              {/* Edit Note */}
              {isEditing && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                    rows={3}
                    placeholder="Add context, findings, questions..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveNote(threadId, task.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                    >
                      Save Note
                    </button>
                    <button
                      onClick={() => {
                        setEditingNote(null);
                        setNoteText('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!task.note && !isEditing && (
                <button
                  onClick={() => {
                    setEditingNote(task.id);
                    setNoteText(task.note);
                  }}
                  className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                  title="Add note"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setAddingChildTo(task.id)}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Add subtask"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Add Child Form */}
          {isAddingChild && (
            <div className="ml-11 mt-2 flex gap-2">
              <input
                type="text"
                value={newChildText}
                onChange={(e) => setNewChildText(e.target.value)}
                placeholder="New subtask..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && addChild(threadId, task.id)}
              />
              <button
                onClick={() => addChild(threadId, task.id)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setAddingChildTo(null);
                  setNewChildText('');
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {task.children.map(child => (
              <TaskItem 
                key={child.id} 
                task={child} 
                threadId={threadId}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ThreadCard = ({ thread, isThreadExpanded, toggleThread }) => {
    const completedCount = thread.tasks.filter(t => t.done).length;
    const totalCount = thread.tasks.length;
    const isAddingSession = addingSessionTo === thread.id;

    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm mb-4">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleThread(thread.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {isThreadExpanded ? 
                    <ChevronDown className="w-5 h-5" /> : 
                    <ChevronRight className="w-5 h-5" />
                  }
                </button>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{thread.title}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{thread.lastWorked}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{completedCount}/{totalCount}</span>
                  <div className="bg-gray-200 rounded-full h-2 w-24">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(completedCount/totalCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  thread.status === 'active' ? 'bg-blue-100 text-blue-700' :
                  thread.status === 'blocked' ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {thread.status}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setAddingSessionTo(thread.id)}
              className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Zap className="w-4 h-4" />
              Log Session
            </button>
          </div>
        </div>

        {/* Add Session Form */}
        {isAddingSession && (
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Log work session</h4>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="What did you work on? What did you discover?"
              className="w-full p-3 border border-gray-300 rounded text-sm resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => addSession(thread.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Save Session
              </button>
              <button
                onClick={() => {
                  setAddingSessionTo(null);
                  setSessionNotes('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isThreadExpanded && (
          <>
            <div className="p-4">

                  {/* Add new top-level task */}
              <button
                onClick={() => setAddingChildTo(`${thread.id}-root`)}
                className="mt-3 flex items-end gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium float-end"
              >
                <Plus className="w-4 h-4" />
                Add task 
              </button>

              <br/>
                <br/>

                {/* Add Root Task Form */}
              {addingChildTo === `${thread.id}-root` && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newChildText}
                    onChange={(e) => setNewChildText(e.target.value)}
                    placeholder="New task..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (!newChildText.trim()) return;
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
                      if (!newChildText.trim()) return;
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
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setAddingChildTo(null);
                      setNewChildText('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <br/>


              {thread.tasks.map(task => (
                <TaskItem key={task.id} task={task} threadId={thread.id} />
              ))}
              
          

            
            </div>

            {/* Work Sessions */}
            {thread.sessions.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Work Sessions</h4>
                {thread.sessions.map((session, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-3 text-sm mb-2">
                    <div className="text-xs text-gray-500 mb-1">
                      {session.date} {session.time}
                    </div>
                    <div className="text-gray-900">{session.notes}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deep Linking Phase 2</h1>
              <p className="text-sm text-gray-600">Nested task tracking with context</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {Object.values(threads).map(thread => (
          <ThreadCard 
            key={thread.id} 
            thread={thread} 
            isThreadExpanded={expandedThreads.has(thread.id)}
            toggleThread={toggleThread}
          />
        ))}

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> Hover over any task to add notes or subtasks. Click notes to edit them. Nest as deep as you need!
          </p>
        </div>
      </div>
    </div>
  );
};

export default NestedWorkflow;