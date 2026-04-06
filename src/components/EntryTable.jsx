import { useState } from 'react'
import EntryRow from './EntryRow.jsx'

export default function EntryTable({ entries, baseline, onUpdate, onDelete }) {
  const [expandedName, setExpandedName] = useState(null)

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <svg className="mx-auto w-12 h-12 mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p>No entries found</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden">
      {/* Table header — hidden when a row is expanded to avoid visual noise */}
      <div className="grid bg-gray-900 border-b border-gray-800 text-xs font-medium text-gray-400 uppercase tracking-wider"
        style={{ gridTemplateColumns: '160px 1fr 1fr 1fr 40px' }}>
        <div className="px-3 py-2">Name</div>
        <div className="px-3 py-2">Title / Username</div>
        <div className="px-3 py-2">Password</div>
        <div className="px-3 py-2">URL / Notes</div>
        <div className="px-3 py-2" />
      </div>

      <div className="divide-y divide-gray-800/60">
        {entries.map(([name, entry]) => (
          <EntryRow
            key={name}
            name={name}
            entry={entry}
            baseEntry={baseline[name]}
            isNew={!baseline[name]}
            isExpanded={expandedName === name}
            onExpand={() => setExpandedName(name)}
            onCollapse={() => setExpandedName(null)}
            onUpdate={(field, value) => onUpdate(name, field, value)}
            onDelete={() => onDelete(name)}
          />
        ))}
      </div>
    </div>
  )
}
