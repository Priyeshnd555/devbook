import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Circle, CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react';

const ThreadedWorkflow = () => {
  const [threads, setThreads] = useState({
    'dl-ios': {
      id: 'dl-ios',
      title: 'iOS Deeplink Implementation',
      parent: 'deeplink',
      status: 'active',
      lastWorked: '2025-11-28 11:30 AM',
      sessions: [
        {
          date: '2025-11-28',
          time: '11:30 AM',
          notes: 'Testing after Android fixes. CMS navigation still unclear - need to ask Sandeep.',
          subtasksAdded: ['Test CMS page navigation', 'Validate all external links']
        },
        {
          date: '2025-11-27',
          time: '10:30 AM',
          notes: 'Found root cause! assetlinks.json pointing to QA package.',
          discovery: true
        }
      ],
      subtasks: [
        { id: 1, text: 'Test basic deeplinks on iOS', done: true, addedDate: '2025-11-27' },
        { id: 2, text: 'Test with cold boot', done: true, addedDate: '2025-11-27' },
        { id: 3, text: 'Test CMS page navigation', done: false, addedDate: '2025-11-28' },
        { id: 4, text: 'Validate all external links', done: false, addedDate: '2025-11-28' }
      ],
      blockers: [],
      relatedTo: ['dl-config']
    },
    'dl-android-assetlinks': {
      id: 'dl-android-assetlinks',
      title: 'Android assetlinks.json Configuration',
      parent: 'deeplink',
      status: 'blocked',
      lastWorked: '2025-11-27 10:30 AM',
      sessions: [
        {
          date: '2025-11-27',
          time: '10:30 AM',
          notes: 'PROD pointing to com.aafes.shopmyexchange.qa instead of .prod. Same issue on iOS.',
          discovery: true,
          links: [
            'https://www.shopmyexchange.com/.well-known/assetlinks.json',
            'https://www.shopmyexchange.com/.well-known/apple-app-site-association'
          ]
        }
      ],
      subtasks: [
        { id: 1, text: 'Identify the issue', done: true, addedDate: '2025-11-27' },
        { id: 2, text: 'Request server team access', done: true, addedDate: '2025-11-27' },
        { id: 3, text: 'Update JSON files', done: false, addedDate: '2025-11-27' },
        { id: 4, text: 'Verify with Google tool', done: false, addedDate: '2025-11-27' }
      ],
      blockers: [
        { what: 'Waiting for server team to update JSON', since: '2025-11-27', critical: true }
      ],
      relatedTo: ['dl-ios', 'dl-config']
    },
    'dl-webview': {
      id: 'dl-webview',
      title: 'WebView URL Interception',
      parent: 'deeplink',
      status: 'done',
      lastWorked: '2025-11-27 2:00 PM',
      sessions: [
        {
          date: '2025-11-27',
          time: '2:00 PM',
          notes: 'Completed! URLs now properly route to native screens. Tested with PDP, PLP, cart.',
          discovery: false
        }
      ],
      subtasks: [
        { id: 1, text: 'Implement URL interception logic', done: true, addedDate: '2025-11-27' },
        { id: 2, text: 'Test with PDP/PLP pages', done: true, addedDate: '2025-11-27' },
        { id: 3, text: 'Test with cart page', done: true, addedDate: '2025-11-27' }
      ],
      blockers: [],
      relatedTo: []
    },
    'dl-code-refactor': {
      id: 'dl-code-refactor',
      title: 'MMA App Switching Code Update',
      parent: 'deeplink',
      status: 'active',
      lastWorked: '2025-11-28 2:15 PM',
      sessions: [
        {
          date: '2025-11-28',
          time: '2:15 PM',
          notes: 'Found switch case that needs updating',
          code: `switch (routePath) {
  case 'mma':
    openApp('com.aafes.militarystar', 'militarystar://',
    'itms-apps://itunes.apple.com/us/app/military-star-mobile/id1434088523');
}`
        }
      ],
      subtasks: [
        { id: 1, text: 'Identify the issue', done: true, addedDate: '2025-11-28' },
        { id: 2, text: 'Refactor switch logic', done: false, addedDate: '2025-11-28' },
        { id: 3, text: 'Test with actual app', done: false, addedDate: '2025-11-28' }
      ],
      blockers: [],
      relatedTo: []
    }
  });

  const [expandedThreads, setExpandedThreads] = useState(['dl-ios', 'dl-android-assetlinks']);
  const [selectedThread, setSelectedThread] = useState(null);
  const [showAddSubtask, setShowAddSubtask] = useState(null);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  const toggleThread = (id) => {
    setExpandedThreads(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleSubtask = (threadId, subtaskId) => {
    setThreads(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        subtasks: prev[threadId].subtasks.map(st =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        )
      }
    }));
  };

  const addSubtask = (threadId) => {
    if (!newSubtask.trim()) return;
    
    const newId = Math.max(...threads[threadId].subtasks.map(s => s.id), 0) + 1;
    setThreads(prev => ({
      ...prev,
      [threadId]: {
        ...prev[threadId],
        subtasks: [...prev[threadId].subtasks, {
          id: newId,
          text: newSubtask,
          done: false,
          addedDate: '2025-11-28'
        }]
      }
    }));
    setNewSubtask('');
    setShowAddSubtask(null);
  };

  const getStatusConfig = (status) => {
    const configs = {
      'active': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', label: 'Active' },
      'blocked': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500', label: 'Blocked' },
      'done': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', label: 'Done' }
    };
    return configs[status];
  };

  const ThreadCard = ({ thread }) => {
    const isExpanded = expandedThreads.includes(thread.id);
    const statusConfig = getStatusConfig(thread.status);
    const completedCount = thread.subtasks.filter(t => t.done).length;
    const totalCount = thread.subtasks.length;
    const isAddingSubtask = showAddSubtask === thread.id;

    return (
      <div className={`bg-white rounded-xl border-2 ${statusConfig.border} shadow-sm mb-4`}>
        <div 
          className="p-4 cursor-pointer hover:bg-gray-50"
          onClick={() => toggleThread(thread.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isExpanded ? 
                  <ChevronDown className="w-5 h-5 text-gray-400" /> : 
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                }
                <h3 className="text-lg font-semibold text-gray-900">{thread.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                  {statusConfig.label}
                </span>
              </div>
              
              <div className="ml-8 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{thread.lastWorked}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{completedCount}/{totalCount}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(completedCount/totalCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {thread.blockers.length > 0 && (
                <div className="ml-8 mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{thread.blockers[0].what}</span>
                </div>
              )}
            </div>

            {thread.status === 'active' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedThread(thread.id);
                  setShowAddSession(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
              >
                <Zap className="w-4 h-4" />
                Work on this
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-200 pt-4">
            {/* Subtasks */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 text-sm">Subtasks</h4>
                <button
                  onClick={() => setShowAddSubtask(thread.id)}
                  className="text-blue-600 text-sm hover:text-blue-700"
                >
                  + Add subtask
                </button>
              </div>

              {isAddingSubtask && (
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="New subtask..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && addSubtask(thread.id)}
                  />
                  <button
                    onClick={() => addSubtask(thread.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSubtask(null);
                      setNewSubtask('');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {thread.subtasks.map((subtask) => (
                  <div 
                    key={subtask.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => toggleSubtask(thread.id, subtask.id)}
                  >
                    {subtask.done ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                    <span className={`flex-1 ${subtask.done ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {subtask.text}
                    </span>
                    <span className="text-xs text-gray-400">{subtask.addedDate}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Sessions */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 text-sm mb-3">Work Sessions</h4>
              <div className="space-y-3">
                {thread.sessions.map((session, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-600">{session.date}</span>
                      <span className="text-xs text-gray-500">{session.time}</span>
                      {session.discovery && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          💡 Discovery
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{session.notes}</p>
                    
                    {session.code && (
                      <div className="bg-gray-900 rounded p-3 overflow-x-auto">
                        <pre className="text-green-400 text-xs font-mono">{session.code}</pre>
                      </div>
                    )}

                    {session.links && (
                      <div className="mt-2 space-y-1">
                        {session.links.map((link, linkIdx) => (
                          <a
                            key={linkIdx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-blue-600 hover:underline truncate"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Related Threads */}
            {thread.relatedTo.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 text-sm mb-2">Related to</h4>
                <div className="flex gap-2">
                  {thread.relatedTo.map(relId => (
                    <button
                      key={relId}
                      onClick={() => toggleThread(relId)}
                      className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-100"
                    >
                      {threads[relId]?.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const activeThreads = Object.values(threads).filter(t => t.status === 'active');
  const blockedThreads = Object.values(threads).filter(t => t.status === 'blocked');
  const doneThreads = Object.values(threads).filter(t => t.status === 'done');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b shadow-sm z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Work Threads</h1>
              <p className="text-sm text-gray-600">Deep Linking - Phase 2</p>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              New Thread
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        
        {/* Add Session Modal */}
        {showAddSession && selectedThread && (
          <div className="mb-6 bg-white rounded-xl border-2 border-blue-300 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Add work session: {threads[selectedThread].title}
            </h3>
            <textarea
              placeholder="What did you do? What did you find?"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddSession(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Save Session
              </button>
            </div>
          </div>
        )}

        {/* Active Threads */}
        {activeThreads.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔥 Active</h2>
            {activeThreads.map(thread => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}

        {/* Blocked Threads */}
        {blockedThreads.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🚫 Blocked</h2>
            {blockedThreads.map(thread => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}

        {/* Done Threads */}
        {doneThreads.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">✅ Done</h2>
            {doneThreads.map(thread => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadedWorkflow;