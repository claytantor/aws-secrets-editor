import { useState, useEffect, useRef } from 'react'
import CopyButton from './CopyButton.jsx'

// ── Compact (collapsed) row ──────────────────────────────────────────────────
function CompactRow({ name, value, isNew, isChanged, nameWidth, onExpand, onDelete }) {
  const changed = isNew || isChanged

  return (
    <div
      className={`grid items-center group cursor-pointer hover:bg-gray-800/40 transition-colors duration-100
        ${changed ? 'border-l-2 border-amber-500 bg-amber-500/5' : 'border-l-2 border-transparent'}`}
      style={{ gridTemplateColumns: `${nameWidth}px 1fr 40px` }}
      onClick={onExpand}
    >
      {/* Name */}
      <div className="px-3 py-2.5 flex items-center gap-1.5 min-w-0">
        {isNew
          ? <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" />
          : changed
            ? <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-400" />
            : null
        }
        <span className="font-mono text-sm text-gray-300 truncate" title={name}>{name}</span>
      </div>

      {/* Value (masked) */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        {value
          ? <span className="font-mono text-gray-500 text-sm tracking-widest select-none">••••••••</span>
          : <span className="text-xs text-gray-700 italic">no value</span>
        }
        {value && (
          <span onClick={e => e.stopPropagation()}>
            <CopyButton value={value} />
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="px-1 py-2.5 flex items-center justify-center">
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="text-gray-700 hover:text-red-400 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
          title="Delete entry"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Expanded (edit) form ─────────────────────────────────────────────────────
function ExpandedForm({ name, value, baseValue, isNew, onSave, onCancel, onDelete }) {
  const [draft, setDraft] = useState(value)
  const [showValue, setShowValue] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSave() {
    if (draft !== value) {
      onSave(draft)
    }
    onCancel()
  }

  function handleCancel() {
    onCancel()
  }

  const changed = isNew || (baseValue !== undefined && baseValue !== draft)

  return (
    <div className={`border-l-2 ${changed ? 'border-amber-500 bg-amber-500/5' : 'border-blue-600 bg-blue-600/5'}`}>
      {/* Form header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-gray-200">{name}</span>
          {isNew && (
            <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded">
              New
            </span>
          )}
          {!isNew && changed && (
            <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
              Modified
            </span>
          )}
        </div>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-300 p-1"
          title="Collapse"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {/* Value field */}
      <div className="px-4 py-4">
        <label className="block text-xs font-medium text-gray-400 mb-1">Value</label>
        <div className={`flex items-center gap-2 bg-gray-800 border rounded-md px-2 py-1
          ${changed ? 'border-amber-500/60' : 'border-gray-700'}`}>
          <input
            ref={inputRef}
            type={showValue ? 'text' : 'password'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-gray-200 py-1"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowValue(v => !v)}
            className="text-gray-500 hover:text-gray-300 p-1 shrink-0"
            title={showValue ? 'Hide value' : 'Show value'}
          >
            {showValue ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <CopyButton value={draft} />
        </div>
      </div>

      {/* Form footer */}
      <div className="flex items-center justify-between px-4 pb-4">
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete entry
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="text-sm px-4 py-1.5 rounded-md border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entry row (switches between compact and expanded) ────────────────────────
export default function EntryRow({
  name, value, baseValue, isNew,
  isExpanded, nameWidth, onExpand, onCollapse,
  onUpdate, onDelete
}) {
  const isChanged = baseValue !== undefined && baseValue !== value

  if (isExpanded) {
    return (
      <ExpandedForm
        name={name}
        value={value}
        baseValue={baseValue}
        isNew={isNew}
        onSave={onUpdate}
        onCancel={onCollapse}
        onDelete={onDelete}
      />
    )
  }

  return (
    <CompactRow
      name={name}
      value={value}
      isNew={isNew}
      isChanged={isChanged}
      nameWidth={nameWidth}
      onExpand={onExpand}
      onDelete={onDelete}
    />
  )
}
