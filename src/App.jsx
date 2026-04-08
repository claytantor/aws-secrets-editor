import { useState, useCallback, useEffect } from 'react'
import { useSession } from './hooks/useSession.js'
import { useEntries } from './hooks/useEntries.js'
import LoginForm from './components/LoginForm.jsx'
import SearchBar from './components/SearchBar.jsx'
import EntryTable from './components/EntryTable.jsx'
import AddEntryForm from './components/AddEntryForm.jsx'
import ImportEnvModal from './components/ImportEnvModal.jsx'
import DiffModal from './components/DiffModal.jsx'
import DeleteModal from './components/DeleteModal.jsx'
import Toast from './components/Toast.jsx'
import { fetchSecret, saveSecret } from './services/api.js'

export default function App() {
  const { session, connect, disconnect } = useSession()
  const entriesHook = useEntries()
  const [search, setSearch] = useState('')
  const [showDiff, setShowDiff] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toasts, setToasts] = useState([])
  const [loading, setLoading] = useState(false)

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Restore entries when a session is already in sessionStorage on mount
  useEffect(() => {
    if (!session) return
    setLoading(true)
    fetchSecret(session)
      .then(data => entriesHook.loadEntries(data.entries || {}))
      .catch(err => {
        if (err.status === 401) {
          disconnect()
        } else {
          addToast(`Failed to load entries: ${err.message}`, 'error')
        }
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleConnect(credentials) {
    setLoading(true)
    try {
      const data = await fetchSecret(credentials)
      entriesHook.loadEntries(data.entries || {})
      connect(credentials)
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  function handleDisconnect() {
    disconnect()
    entriesHook.loadEntries({})
    setSearch('')
  }

  async function handleSaveConfirm() {
    setLoading(true)
    try {
      const result = await saveSecret(session, entriesHook.entries)
      if (result.success) {
        const refreshed = await fetchSecret(session)
        entriesHook.loadEntries(refreshed.entries || {})
        setShowDiff(false)
        addToast('Changes saved successfully')
      }
    } catch (err) {
      if (err.status === 401) {
        addToast('Credentials may have expired. Please reconnect.', 'error')
        handleDisconnect()
      } else {
        addToast(`Save failed: ${err.message}`, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      entriesHook.deleteEntry(deleteTarget)
      setDeleteTarget(null)
    }
  }, [deleteTarget, entriesHook])

  const filteredEntries = Object.entries(entriesHook.entries).filter(([name, value]) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      name.toLowerCase().includes(q) ||
      (value || '').toLowerCase().includes(q)
    )
  })

  const totalCount = Object.keys(entriesHook.entries).length
  const changeCount = entriesHook.changeCount()

  function handleExport() {
    // Export as flat JSON format: {"NAME": "value"}
    const json = JSON.stringify(entriesHook.entries, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.secretName}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast('Exported successfully')
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoginForm onConnect={handleConnect} loading={loading} />
        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-100">AWS Secrets Editor</span>
          <span className="text-sm text-gray-400 font-mono bg-gray-800 px-2 py-0.5 rounded">
            {session.secretName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDiff(true)}
            disabled={!entriesHook.hasChanges() || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-md"
          >
            Save Changes
            {changeCount > 0 && (
              <span className="bg-blue-400 text-blue-900 text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {changeCount}
              </span>
            )}
          </button>
          <button
            onClick={handleDisconnect}
            className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-md border border-gray-700 hover:border-gray-500"
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-2 flex items-center gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          count={filteredEntries.length}
          total={totalCount}
        />
        <AddEntryForm
          existingNames={Object.keys(entriesHook.entries)}
          onAdd={(name, data) => entriesHook.addEntry(name, data)}
        />
        <button
          onClick={handleExport}
          disabled={totalCount === 0}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md shrink-0 disabled:bg-gray-800 disabled:text-gray-600 disabled:border-gray-800"
          title="Export as JSON"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V3" />
          </svg>
          Export
        </button>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md shrink-0"
          title="Import NAME=value pairs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import
        </button>
      </div>

      {/* Table */}
      <main className="flex-1 overflow-auto p-4">
        <EntryTable
          entries={filteredEntries}
          baseline={entriesHook.baseline}
          onUpdate={entriesHook.updateValue}
          onDelete={(name) => setDeleteTarget(name)}
        />
      </main>

      {showImport && (
        <ImportEnvModal
          existingNames={Object.keys(entriesHook.entries)}
          onImport={(items) => {
            items.forEach(({ name, data }) => entriesHook.addEntry(name, data))
            addToast(`Imported ${items.length} ${items.length === 1 ? 'entry' : 'entries'}`)
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {showDiff && (
        <DiffModal
          session={session}
          localEntries={entriesHook.entries}
          computeDiff={entriesHook.computeDiff}
          onConfirm={handleSaveConfirm}
          onCancel={() => setShowDiff(false)}
          loading={loading}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
