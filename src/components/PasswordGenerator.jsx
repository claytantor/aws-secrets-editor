import { useState } from 'react'

function generatePassword(length, opts) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let charset = ''
  if (opts.uppercase) charset += upper
  if (opts.lowercase) charset += lower
  if (opts.numbers) charset += digits
  if (opts.symbols) charset += symbols
  if (!charset) charset = lower + digits

  const array = new Uint32Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, v => charset[v % charset.length]).join('')
}

export default function PasswordGenerator({ onUse, onClose }) {
  const [length, setLength] = useState(24)
  const [opts, setOpts] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
  const [preview, setPreview] = useState(() => generatePassword(24, {
    uppercase: true, lowercase: true, numbers: true, symbols: true
  }))

  function toggle(key) {
    setOpts(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function generate() {
    setPreview(generatePassword(length, opts))
  }

  function handleLengthChange(v) {
    const n = Math.max(8, Math.min(128, Number(v)))
    setLength(n)
    setPreview(generatePassword(n, opts))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-100">Password Generator</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Length */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-400">Length</label>
            <span className="text-xs font-mono text-gray-300">{length}</span>
          </div>
          <input
            type="range"
            min={8}
            max={128}
            value={length}
            onChange={e => handleLengthChange(e.target.value)}
            className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { key: 'uppercase', label: 'Uppercase (A-Z)' },
            { key: 'lowercase', label: 'Lowercase (a-z)' },
            { key: 'numbers', label: 'Numbers (0-9)' },
            { key: 'symbols', label: 'Symbols (!@#…)' }
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={opts[key]}
                onChange={() => toggle(key)}
                className="w-3.5 h-3.5 rounded accent-blue-500 bg-gray-700 border-gray-600"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-gray-800 rounded-md px-3 py-2 mb-4 font-mono text-sm text-gray-200 break-all">
          {preview}
        </div>

        <div className="flex gap-2">
          <button
            onClick={generate}
            className="flex-1 text-sm py-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-gray-100 hover:border-gray-500"
          >
            Regenerate
          </button>
          <button
            onClick={() => { onUse(preview); onClose() }}
            className="flex-1 text-sm py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  )
}
