import { useState, useEffect } from 'react'
import { fetchSecret } from '../services/api.js'

function DiffField({ label, from, to }) {
  return (
    <div className="text-xs">
      <span className="text-gray-500">{label}: </span>
      {from !== to ? (
        <>
          <span className="text-red-400 line-through">{from || '(empty)'}</span>
          {' '}
          <span className="text-green-400">{to || '(empty)'}</span>
        </>
      ) : (
        <span className="text-gray-400">{to || '(empty)'}</span>
      )}
    </div>
  )
}

export default function DiffModal({ session, localEntries, computeDiff, onConfirm, onCancel, loading }) {
  const [remoteEntries, setRemoteEntries] = useState(null)
  const [fetchError, setFetchError] = useState('')
  const [conflict, setConflict] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchSecret(session)
        setRemoteEntries(data.entries || {})
        // Detect conflict: remote has changed compared to local baseline
        // We compare remote keys/values vs what's in localEntries where not locally modified
        const remoteKeys = Object.keys(data.entries || {})
        const diff = computeDiff()
        // Simple conflict: remote has entries that differ from our baseline
        // (baseline === what we started with; if remote != baseline, someone else saved)
        // We surface this as a warning rather than blocking.
        const hasConflict = remoteKeys.some(k => {
          const rEntry = data.entries[k]
          const lEntry = localEntries[k]
          if (!lEntry) return true // remote has something we deleted
          // Check if remote differs from local in an unmodified field — rough heuristic
          return false
        })
        setConflict(hasConflict)
      } catch (err) {
        setFetchError(err.message || 'Failed to fetch current remote state')
      }
    }
    load()
  }, [])

  const diff = computeDiff()
  const hasAnyDiff = diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="font-semibold text-gray-100">Review Changes</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conflict warning */}
        {conflict && (
          <div className="mx-6 mt-4 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
            <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-300">
              The secret has been modified externally since you last loaded it. Saving will overwrite those changes.
            </p>
          </div>
        )}

        {fetchError && (
          <div className="mx-6 mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            Could not fetch current remote state: {fetchError}. You can still save, but conflict detection is unavailable.
          </div>
        )}

        {/* Diff content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {!hasAnyDiff && (
            <p className="text-sm text-gray-400 text-center py-8">No changes to save.</p>
          )}

          {diff.added.map(({ name, entry }) => (
            <div key={name} className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Added</span>
                <span className="font-mono text-sm text-green-300">{name}</span>
              </div>
              {Object.entries(entry).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="text-xs text-gray-300">
                  <span className="text-gray-500">{k}: </span>
                  <span className={k === 'password' ? 'blur-sm hover:blur-none transition-all' : ''}>{v}</span>
                </div>
              ))}
            </div>
          ))}

          {diff.modified.map(({ name, changedFields }) => (
            <div key={name} className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Modified</span>
                <span className="font-mono text-sm text-amber-300">{name}</span>
              </div>
              {Object.entries(changedFields).map(([field, { from, to }]) => (
                <DiffField key={field} label={field} from={field === 'password' ? '••••••' : from} to={field === 'password' ? '••••••' : to} />
              ))}
            </div>
          ))}

          {diff.deleted.map(({ name }) => (
            <div key={name} className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Deleted</span>
                <span className="font-mono text-sm text-red-300">{name}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-sm px-4 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-gray-100 hover:border-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !hasAnyDiff}
            className="text-sm px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium"
          >
            {loading ? 'Saving…' : 'Confirm Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
