import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import CopyButton from './CopyButton.jsx'
import PasswordField from './PasswordField.jsx'

const NOTES_MODES = ['text', 'markdown', 'preview']

function NotesField({ value, onChange, changed }) {
  const [mode, setMode] = useState('text')

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-gray-400">Notes</label>
        <div className="flex items-center bg-gray-800 border border-gray-700 rounded-md overflow-hidden">
          {NOTES_MODES.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2.5 py-0.5 text-xs capitalize transition-colors
                ${mode === m
                  ? 'bg-gray-700 text-gray-100'
                  : 'text-gray-500 hover:text-gray-300'
                }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === 'preview' ? (
        <div
          className={`min-h-[80px] w-full rounded-md border px-3 py-2 text-sm text-gray-200
            prose-notes overflow-auto
            ${changed ? 'border-amber-500/60 bg-amber-500/5' : 'border-gray-700 bg-gray-800/50'}`}
        >
          {value
            ? <ReactMarkdown
                components={{
                  p:      ({node, ...p}) => <p className="mb-2 last:mb-0 text-sm text-gray-200" {...p} />,
                  strong: ({node, ...p}) => <strong className="font-semibold text-gray-100" {...p} />,
                  em:     ({node, ...p}) => <em className="italic text-gray-300" {...p} />,
                  a:      ({node, href, ...p}) => (
                    /^https?:\/\//i.test(href || '')
                      ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300" {...p} />
                      : <span className="text-blue-400" {...p} />
                  ),
                  ul:     ({node, ...p}) => <ul className="list-disc list-inside mb-2 space-y-0.5 text-sm text-gray-300" {...p} />,
                  ol:     ({node, ...p}) => <ol className="list-decimal list-inside mb-2 space-y-0.5 text-sm text-gray-300" {...p} />,
                  li:     ({node, ...p}) => <li className="text-sm text-gray-300" {...p} />,
                  code:   ({node, inline, ...p}) => inline
                    ? <code className="font-mono text-xs bg-gray-700 text-green-300 px-1 py-0.5 rounded" {...p} />
                    : <code className="block font-mono text-xs bg-gray-700 text-green-300 p-2 rounded my-1 overflow-x-auto" {...p} />,
                  pre:    ({node, ...p}) => <pre className="bg-gray-700 rounded my-1 overflow-x-auto" {...p} />,
                  h1:     ({node, ...p}) => <h1 className="text-base font-semibold text-gray-100 mb-1" {...p} />,
                  h2:     ({node, ...p}) => <h2 className="text-sm font-semibold text-gray-100 mb-1" {...p} />,
                  h3:     ({node, ...p}) => <h3 className="text-sm font-medium text-gray-200 mb-1" {...p} />,
                  blockquote: ({node, ...p}) => <blockquote className="border-l-2 border-gray-600 pl-3 text-gray-400 italic my-1" {...p} />,
                  hr:     ({node, ...p}) => <hr className="border-gray-700 my-2" {...p} />,
                }}
              >
                {value}
              </ReactMarkdown>
            : <span className="text-gray-600 italic">No notes.</span>
          }
        </div>
      ) : (
        <textarea
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={mode === 'markdown' ? 'Supports **markdown** syntax…' : 'Notes…'}
          rows={4}
          spellCheck={mode === 'text'}
          className={`w-full text-sm resize-y min-h-[80px]
            ${mode === 'markdown' ? 'font-mono' : ''}
            ${changed ? 'border-amber-500/60' : ''}`}
        />
      )}
    </div>
  )
}

function isChanged(base, current, field) {
  if (!base) return false
  return (base[field] || '') !== (current[field] || '')
}

function rowHasChanges(base, entry) {
  if (!base) return false
  return ['title', 'username', 'password', 'url', 'notes'].some(f =>
    isChanged(base, entry, f)
  )
}

// ── Compact (collapsed) row ──────────────────────────────────────────────────
function CompactRow({ name, entry, baseEntry, isNew, nameWidth, onExpand, onDelete }) {
  const changed = isNew || rowHasChanges(baseEntry, entry)

  return (
    <div
      className={`grid items-center group cursor-pointer hover:bg-gray-800/40 transition-colors duration-100
        ${changed ? 'border-l-2 border-amber-500 bg-amber-500/5' : 'border-l-2 border-transparent'}`}
      style={{ gridTemplateColumns: `${nameWidth}px 1fr 1fr 40px` }}
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

      {/* Title + username */}
      <div className="px-3 py-2.5 min-w-0">
        <div className="text-sm text-gray-200 truncate">{entry.title || <span className="text-gray-600 italic">no title</span>}</div>
        {entry.username && (
          <div className="text-xs text-gray-500 truncate mt-0.5">{entry.username}</div>
        )}
      </div>

      {/* Password indicator */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        {entry.password
          ? <span className="font-mono text-gray-500 text-sm tracking-widest select-none">••••••••</span>
          : <span className="text-xs text-gray-700 italic">no password</span>
        }
        {entry.password && (
          <span onClick={e => e.stopPropagation()}>
            <CopyButton value={entry.password} />
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
function ExpandedForm({ name, entry, baseEntry, isNew, onSave, onCancel, onDelete }) {
  const [draft, setDraft] = useState({ ...entry })
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function setField(field, value) {
    setDraft(prev => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    // Apply each changed field
    Object.keys(draft).forEach(field => {
      if (draft[field] !== entry[field]) {
        onSave(field, draft[field])
      }
    })
    onCancel() // collapse
  }

  function handleCancel() {
    onCancel() // discard draft, collapse
  }

  const changed = isNew || rowHasChanges(baseEntry, draft)

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

      {/* Form fields */}
      <div className="px-4 py-4 grid grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
          <input
            ref={titleRef}
            type="text"
            value={draft.title || ''}
            onChange={e => setField('title', e.target.value)}
            placeholder="Display name"
            className={`w-full text-sm ${isChanged(baseEntry, draft, 'title') ? 'border-amber-500/60' : ''}`}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft.username || ''}
              onChange={e => setField('username', e.target.value)}
              placeholder="username"
              className={`flex-1 text-sm ${isChanged(baseEntry, draft, 'username') ? 'border-amber-500/60' : ''}`}
            />
            <CopyButton value={draft.username || ''} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
          <div className={`flex items-center gap-1 bg-gray-800 border rounded-md px-2 py-1
            ${isChanged(baseEntry, draft, 'password') ? 'border-amber-500/60' : 'border-gray-700'}`}>
            <PasswordField
              value={draft.password || ''}
              onChange={v => setField('password', v)}
              changed={isChanged(baseEntry, draft, 'password')}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={draft.url || ''}
              onChange={e => setField('url', e.target.value)}
              placeholder="https://"
              className={`flex-1 text-sm ${isChanged(baseEntry, draft, 'url') ? 'border-amber-500/60' : ''}`}
            />
            <CopyButton value={draft.url || ''} />
            {draft.url && /^https?:\/\//i.test(draft.url) && (
              <a
                href={draft.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 shrink-0"
                title="Open URL"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="col-span-2">
          <NotesField
            value={draft.notes || ''}
            onChange={v => setField('notes', v)}
            changed={isChanged(baseEntry, draft, 'notes')}
          />
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
  name, entry, baseEntry, isNew,
  isExpanded, nameWidth, onExpand, onCollapse,
  onUpdate, onDelete
}) {
  if (isExpanded) {
    return (
      <ExpandedForm
        name={name}
        entry={entry}
        baseEntry={baseEntry}
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
      entry={entry}
      baseEntry={baseEntry}
      isNew={isNew}
      nameWidth={nameWidth}
      onExpand={onExpand}
      onDelete={onDelete}
    />
  )
}
