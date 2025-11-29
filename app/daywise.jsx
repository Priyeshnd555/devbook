import React, { useState } from 'react';
import { Plus } from 'lucide-react';

const SimpleDevNotebook = () => {
  const [showAdd, setShowAdd] = useState(false);

  const entries = [
    {
      date: 'Thursday, Nov 28',
      discoveries: [
        'iOS deeplink validation still needs checking after Android fixes',
        'CMS navigation logic is unclear - need to ask Sandeep',
        'External browser not working for browse URLs - needs investigation'
      ],
      work: [
        'Checked MMA app switching code - needs update',
        'Started iOS testing session'
      ],
      blockers: [
        {
          what: 'PROD assetlinks.json pointing to QA package (com.aafes.shopmyexchange.qa)',
          why: 'Production deeplinks completely broken',
          waiting: 'Server team needs to update the JSON file'
        }
      ]
    },
    {
      date: 'Wednesday, Nov 27',
      discoveries: [
        '🎯 ROOT CAUSE FOUND: PROD assetlinks.json has wrong package name',
        'Same assetlinks issue exists on iOS apple-app-site-association',
        'WebView URL interception works perfectly now',
        'Keystore file verified and good to go'
      ],
      work: [
        'Completed WebView URL interception implementation',
        'Verified keystore with Ritesh',
        'Investigated why PROD links not working from notepad'
      ],
      blockers: [
        {
          what: 'Need server access to fix assetlinks.json',
          why: 'Can\'t deploy to production until this is fixed',
          waiting: 'Server team'
        }
      ]
    },
    {
      date: 'Monday, Nov 25',
      discoveries: [
        'Phase 2 is different from Phase 1 because: shell navigation, webview handling, guest flows',
        'Deep linking from Braze working end-to-end now',
        'Login flow with deeplinks working',
        'External browser return handling working',
        'Cold boot deeplinks working',
        '2FA scenarios working',
        'Dynamic URL deeplinking completed'
      ],
      work: [
        'Documented Phase 2 vs Phase 1 differences',
        'Created status update of what\'s working',
        'Completed shell navigation',
        'Fixed login issue'
      ],
      blockers: []
    },
    {
      date: 'Friday, Nov 21',
      discoveries: [
        'Sweepstakes link going to 404 - need to check ALL external links, not just a few',
        'Need to migrate static links to Firebase Remote Config after deeplink work'
      ],
      work: [
        'Got new ticket ATGR-17336 for sweepstakes issue'
      ],
      blockers: []
    },
    {
      date: 'Wednesday, Nov 20',
      discoveries: [
        'Need to check ALL external links, not just the few mentioned in tickets',
        'External link handling needs to be comprehensive'
      ],
      work: [
        'Completed ATGR-17226',
        'Completed ATGR-16817',
        'Working on ATGR-12378 (Deep Linking)',
        'Working on ATGR-12426 (External Links)'
      ],
      blockers: []
    },
    {
      date: 'Monday, Nov 18',
      discoveries: [
        'Double tap issue was default iOS behavior - not a bug',
        'ATGR-16641 is too complex - needs POC approach'
      ],
      work: [
        'Fixed double tap to activate issue (ATGR-16667)',
        'Need to validate and reject ATGR-16668',
        'Firebase config move for privacy policy links',
        'Deeplink documentation in progress'
      ],
      blockers: [
        {
          what: 'Waiting for Abhishek ticket from Ritesh',
          why: 'Need it to proceed with external link work',
          waiting: 'Ritesh to assign'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-amber-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Notebook Header */}
        <div className="mb-12 pb-6 border-b-2 border-amber-900">
          <h1 className="text-5xl font-serif text-amber-900 mb-2">Dev Notebook</h1>
          <p className="text-amber-700 text-lg">Deep Linking Implementation - Phase 2</p>
        </div>

        {/* Simple Add Button */}
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="mb-8 flex items-center gap-2 text-amber-700 hover:text-amber-900 font-medium"
        >
          <Plus className="w-5 h-5" />
          {showAdd ? 'Cancel' : 'Add Today\'s Entry'}
        </button>

        {/* Quick Add Form */}
        {showAdd && (
          <div className="mb-12 bg-white p-6 rounded-lg border-2 border-amber-200 shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  What did you discover/learn today?
                </label>
                <textarea
                  rows={3}
                  placeholder="Key findings, bugs found, root causes, 'aha' moments..."
                  className="w-full p-3 border border-amber-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  What work did you do? (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Tickets worked on, implementations..."
                  className="w-full p-3 border border-amber-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-2">
                  Any blockers?
                </label>
                <textarea
                  rows={2}
                  placeholder="What's blocking you and who can unblock it?"
                  className="w-full p-3 border border-amber-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded transition-colors">
                Save Entry
              </button>
            </div>
          </div>
        )}

        {/* Entries - Just a clean reading flow */}
        <div className="space-y-12">
          {entries.map((entry, idx) => (
            <div key={idx} className="bg-white p-8 rounded-lg shadow-sm border border-amber-200">
              
              {/* Date */}
              <h2 className="text-2xl font-serif text-amber-900 mb-6 pb-3 border-b border-amber-200">
                {entry.date}
              </h2>

              {/* Discoveries - The valuable stuff */}
              {entry.discoveries.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm uppercase tracking-wide text-amber-600 font-semibold mb-3">
                    💡 Discoveries & Learnings
                  </h3>
                  <div className="space-y-2">
                    {entry.discoveries.map((item, i) => (
                      <div key={i} className="flex gap-3 text-amber-900 leading-relaxed">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Done */}
              {entry.work.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm uppercase tracking-wide text-amber-600 font-semibold mb-3">
                    ⚙️ Work Done
                  </h3>
                  <div className="space-y-2">
                    {entry.work.map((item, i) => (
                      <div key={i} className="flex gap-3 text-amber-800 leading-relaxed">
                        <span className="text-amber-400 mt-1">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blockers */}
              {entry.blockers.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                  <h3 className="text-sm uppercase tracking-wide text-red-700 font-semibold mb-3">
                    🚫 Blocked
                  </h3>
                  {entry.blockers.map((blocker, i) => (
                    <div key={i} className="mb-3 last:mb-0">
                      <div className="font-medium text-red-900 mb-1">{blocker.what}</div>
                      <div className="text-sm text-red-700 mb-1">Why it matters: {blocker.why}</div>
                      <div className="text-sm text-red-600">Waiting on: {blocker.waiting}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Simple footer */}
        <div className="mt-16 pt-8 border-t border-amber-300 text-center text-sm text-amber-600">
          Scroll up to see what you learned yesterday ↑
        </div>
      </div>
    </div>
  );
};

export default SimpleDevNotebook;