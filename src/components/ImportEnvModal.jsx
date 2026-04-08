import { useState, useMemo } from 'react'

function parseLines(text) {
  const entries = []
  const errors = []

  text.split('\n').forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith('#')) return

    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) {
      errors.push(`Line ${i + 1}: no "=" found — "${line}"`)
      return
    }

    const key = line.slice(0, eqIdx).trim()
    // Strip inline comments: anything after the first space+# sequence
    const value = line.slice(eqIdx + 1).replace(/\s+#.*$/, '').trim()

    if (!key) {
      errors.push(`Line ${i + 1}: empty key`)
      return
    }
    if (/\s/.test(key)) {
      errors.push(`Line ${i + 1}: key "${key}" contains spaces`)
      return
    }

    entries.push({ name: key, value })
  })

  return { entries, errors }
}

export default function ImportEnvModal({ existingNames, onImport, onClose }) {
  const [text, setText] = useState('')

  const { entries, errors } = useMemo(() => parseLines(text), [text])

  const duplicates = entries.filter(e => existingNames.includes(e.name))
  const newEntries = entries.filter(e => !existingNames.includes(e.name))

  function handleImport() {
    const toAdd = entries.map(e => ({ name: e.name, data: e.value }))
    onImport(toAdd)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h3 className="font-semibold text-gray-100">Import from env format</h3>
            <p className="text-xs text-gray-500 mt-0.5">Paste <code className="font-mono">KEY=VALUE</code> pairs, one per line. Values will be stored as flat JSON.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Textarea */}
        <div className="px-6 pt-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"ANTHROPIC_API_KEY=sk-ant-...\nOPENAI_API_KEY=sk-proj-...\nFIREWORKS_API_KEY=fw_..."}
            rows={7}
            className="w-full font-mono text-xs resize-none"
            autoFocus
            spellCheck={false}
          />
        </div>

        {/* Preview */}
        {entries.length > 0 && (
          <div className="px-6 pt-3 flex-1 overflow-y-auto">

            {errors.length > 0 && (
              <div className="mb-3 space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-400">{e}</p>
                ))}
              </div>
            )}

            {duplicates.length > 0 && (
              <div className="mb-3 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                <p className="text-xs font-medium text-amber-400 mb-1">
                  {duplicates.length} existing {duplicates.length === 1 ? 'entry' : 'entries'} will be overwritten:
                </p>
                {duplicates.map(e => (
                  <p key={e.name} className="text-xs font-mono text-amber-300">{e.name}</p>
                ))}
              </div>
            )}

            <p className="text-xs font-medium text-gray-400 mb-2">
              {newEntries.length} new + {duplicates.length} overwrite — {entries.length} total
            </p>

            <div className="space-y-1 pb-1">
              {entries.map(e => (
                <div
                  key={e.name}
                  className={`flex items-center justify-between gap-3 px-3 py-1.5 rounded-md text-xs
                    ${existingNames.includes(e.name)
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-gray-800/60'}`}
                >
                  <span className="font-mono text-gray-200 shrink-0">{e.name}</span>
                  <span className="font-mono text-gray-500 truncate text-right">
                    {e.value.length > 24
                      ? e.value.slice(0, 10) + '…' + e.value.slice(-6)
                      : e.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-800 mt-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-gray-100 hover:border-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={entries.length === 0}
            className="text-sm px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium"
          >
            Import {entries.length > 0 ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
