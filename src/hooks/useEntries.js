import { useState, useCallback } from 'react'

/**
 * Manages the local entry state and tracks which entries have been modified,
 * added, or deleted compared to the remote (baseline) state.
 *
 * Schema: Flat JSON format { [key]: "value" }
 *
 * Example:
 *   {
 *     "DATABASE_URL": "postgresql://user:pass@host/db",
 *     "API_KEY": "sk-abc123..."
 *   }
 *
 * Old nested format (with title/username/password/url/notes) is automatically
 * normalized by the backend when fetching secrets.
 */
export function useEntries() {
  // Current working copy { [name]: string }
  const [entries, setEntries] = useState({})
  // Snapshot of what was last fetched from remote
  const [baseline, setBaseline] = useState({})
  // Names of entries deleted locally
  const [deletedNames, setDeletedNames] = useState(new Set())

  function loadEntries(remoteEntries) {
    setEntries(remoteEntries)
    setBaseline(remoteEntries)
    setDeletedNames(new Set())
  }

  const updateValue = useCallback((name, value) => {
    setEntries(prev => ({ ...prev, [name]: value }))
  }, [])

  const addEntry = useCallback((name, value = '') => {
    setEntries(prev => ({
      [name]: value,
      ...prev
    }))
  }, [])

  const deleteEntry = useCallback((name) => {
    setEntries(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
    setDeletedNames(prev => new Set([...prev, name]))
  }, [])

  function clearTracking() {
    setBaseline(entries)
    setDeletedNames(new Set())
  }

  /**
   * Returns a diff summary comparing local state vs baseline.
   * { added: [], modified: [], deleted: [] }
   */
  function computeDiff() {
    const added = []
    const modified = []
    const deleted = []

    for (const name of Object.keys(entries)) {
      if (baseline[name] === undefined) {
        added.push({ name, value: entries[name] })
      } else if (baseline[name] !== entries[name]) {
        modified.push({ name, from: baseline[name], to: entries[name] })
      }
    }

    for (const name of deletedNames) {
      if (baseline[name] !== undefined) {
        deleted.push({ name, value: baseline[name] })
      }
    }

    return { added, modified, deleted }
  }

  const hasChanges = () => {
    const diff = computeDiff()
    return diff.added.length > 0 || diff.modified.length > 0 || diff.deleted.length > 0
  }

  const changeCount = () => {
    const diff = computeDiff()
    return diff.added.length + diff.modified.length + diff.deleted.length
  }

  return {
    entries,
    baseline,
    loadEntries,
    updateValue,
    addEntry,
    deleteEntry,
    clearTracking,
    computeDiff,
    hasChanges,
    changeCount
  }
}
