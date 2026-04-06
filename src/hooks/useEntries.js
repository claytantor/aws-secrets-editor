import { useState, useCallback } from 'react'

/**
 * Manages the local entry state and tracks which entries have been modified,
 * added, or deleted compared to the remote (baseline) state.
 */
export function useEntries() {
  // Current working copy { [name]: { title, username, password, url, notes } }
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

  const updateField = useCallback((name, field, value) => {
    setEntries(prev => ({
      ...prev,
      [name]: { ...prev[name], [field]: value }
    }))
  }, [])

  const addEntry = useCallback((name, data) => {
    setEntries(prev => ({
      [name]: data,
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
      if (!baseline[name]) {
        added.push({ name, entry: entries[name] })
      } else {
        const base = baseline[name]
        const curr = entries[name]
        const changedFields = {}
        for (const field of ['title', 'username', 'password', 'url', 'notes']) {
          if ((base[field] || '') !== (curr[field] || '')) {
            changedFields[field] = { from: base[field] || '', to: curr[field] || '' }
          }
        }
        if (Object.keys(changedFields).length > 0) {
          modified.push({ name, changedFields })
        }
      }
    }

    for (const name of deletedNames) {
      if (baseline[name]) {
        deleted.push({ name, entry: baseline[name] })
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
    updateField,
    addEntry,
    deleteEntry,
    clearTracking,
    computeDiff,
    hasChanges,
    changeCount
  }
}
