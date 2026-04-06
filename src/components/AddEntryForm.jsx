import { useState } from 'react'

const EMPTY_ENTRY = { title: '', username: '', password: '', url: '', notes: '' }

export default function AddEntryForm({ existingNames, onAdd }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  function validateName(value) {
    if (!value) return 'Name is required'
    if (/\s/.test(value)) return 'Name cannot contain spaces'
    if (existingNames.includes(value)) return 'Name already exists'
    return ''
  }

  function handleNameBlur() {
    setNameError(validateName(name))
  }

  function handleAdd() {
    const err = validateName(name)
    if (err) {
      setNameError(err)
      return
    }
    onAdd(name, { ...EMPTY_ENTRY })
    setName('')
    setNameError('')
    setOpen(false)
  }

  function handleCancel() {
    setName('')
    setNameError('')
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') handleCancel()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-md shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Entry
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex flex-col gap-0.5">
        <input
          type="text"
          value={name}
          onChange={e => { setName(e.target.value); setNameError('') }}
          onBlur={handleNameBlur}
          onKeyDown={handleKeyDown}
          placeholder="entry-name (no spaces)"
          className={`font-mono text-sm w-52 ${nameError ? 'border-red-500' : ''}`}
          autoFocus
        />
        {nameError && (
          <span className="text-xs text-red-400">{nameError}</span>
        )}
      </div>
      <button
        onClick={handleAdd}
        className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium"
      >
        Add
      </button>
      <button
        onClick={handleCancel}
        className="text-sm px-3 py-1.5 rounded-md border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500"
      >
        Cancel
      </button>
    </div>
  )
}
