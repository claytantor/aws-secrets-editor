import { useState } from 'react'
import { connect as apiConnect } from '../services/api.js'

const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
  'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'ap-south-1', 'ca-central-1', 'sa-east-1', 'me-south-1', 'af-south-1'
]

const REQUIRED_KEYS = ['accessKeyId', 'secretAccessKey', 'region', 'secretName']

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••'
  return key.slice(0, 4) + '••••' + key.slice(-4)
}

// ── Compact view card ────────────────────────────────────────────────────────
function CompactView({ form, onEdit, onConnect, busy, error }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-gray-200">Credentials ready</span>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 border border-gray-700 hover:border-gray-500 px-2.5 py-1 rounded-md"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit
        </button>
      </div>

      <div className="px-5 py-3 space-y-2">
        <Row label="Access Key ID" value={maskKey(form.accessKeyId)} mono />
        <Row label="Region"        value={form.region} mono />
        <Row label="Secret Name"   value={form.secretName} mono />
      </div>

      {error && (
        <div className="mx-5 mb-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="px-5 pb-4">
        <button
          onClick={onConnect}
          disabled={busy}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium text-sm py-2 rounded-md"
        >
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={`text-xs text-gray-300 truncate text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function LoginForm({ onConnect, loading }) {
  const [form, setForm] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
    secretName: ''
  })
  const [error, setError]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [pasteMode, setPasteMode]   = useState(false)
  const [pasteText, setPasteText]   = useState('')
  const [pasteError, setPasteError] = useState('')
  // compact = true once the form is fully populated; user can toggle back
  const [compact, setCompact] = useState(false)

  const isPopulated =
    form.accessKeyId && form.secretAccessKey && form.region && form.secretName

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  function handlePasteChange(text) {
    setPasteText(text)
    setPasteError('')
    if (!text.trim()) return
    try {
      const parsed = JSON.parse(text)
      const missing = REQUIRED_KEYS.filter(k => !parsed[k])
      if (missing.length > 0) {
        setPasteError(`Missing required fields: ${missing.join(', ')}`)
        return
      }
      const next = {
        accessKeyId:     String(parsed.accessKeyId).trim(),
        secretAccessKey: String(parsed.secretAccessKey).trim(),
        region:          String(parsed.region).trim(),
        secretName:      String(parsed.secretName).trim()
      }
      setForm(next)
      // Auto-collapse to compact view once JSON is valid
      setCompact(true)
      setPasteMode(false)
      setPasteText('')
    } catch {
      setPasteError('Invalid JSON — check the format below')
    }
  }

  async function submit(e) {
    e?.preventDefault()
    setError('')
    setSubmitting(true)
    const trimmed = {
      accessKeyId:     form.accessKeyId.trim(),
      secretAccessKey: form.secretAccessKey.trim(),
      region:          form.region.trim(),
      secretName:      form.secretName.trim()
    }
    try {
      const result = await apiConnect(trimmed)
      if (!result.success) {
        setError(result.error || 'Connection failed')
        return
      }
      await onConnect(trimmed)
    } catch (err) {
      setError(err.message || 'Network error — is the server running?')
    } finally {
      setSubmitting(false)
    }
  }

  const busy = submitting || loading
  const pastePopulated = pasteMode && form.accessKeyId && form.secretAccessKey && form.secretName

  // ── Compact view ──────────────────────────────────────────────────────────
  if (compact && isPopulated) {
    return (
      <div className="w-full max-w-md">
        <Header />
        <CompactView
          form={form}
          onEdit={() => setCompact(false)}
          onConnect={submit}
          busy={busy}
          error={error}
        />
        <Footer />
      </div>
    )
  }

  // ── Expanded (edit) view ──────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <Header />

      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">

        {/* Input-mode toggle row */}
        <div className="flex items-center justify-between pb-1 border-b border-gray-800">
          <span className="text-xs text-gray-500">
            {pasteMode ? 'Paste JSON credentials' : 'Enter credentials manually'}
          </span>
          <div className="flex items-center gap-3">
            {isPopulated && (
              <button
                type="button"
                onClick={() => setCompact(true)}
                className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 15l7-7 7 7" />
                </svg>
                Collapse
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPasteMode(v => !v)
                setPasteText('')
                setPasteError('')
              }}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {pasteMode ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Switch to fields
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Paste JSON
                </>
              )}
            </button>
          </div>
        </div>

        {pasteMode ? (
          /* ── Paste sub-mode ── */
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Paste credentials JSON
            </label>
            <textarea
              value={pasteText}
              onChange={e => handlePasteChange(e.target.value)}
              placeholder={`{\n  "accessKeyId": "AKIA...",\n  "secretAccessKey": "...",\n  "region": "us-east-1",\n  "secretName": "my-app/credentials"\n}`}
              rows={7}
              className="w-full font-mono text-xs resize-none"
              autoFocus
              spellCheck={false}
            />
            {pasteError && (
              <p className="mt-1 text-xs text-red-400">{pasteError}</p>
            )}
            {pastePopulated && !pasteError && (
              <div className="mt-2 space-y-1 text-xs text-gray-400 bg-gray-800/60 rounded-md px-3 py-2">
                <div><span className="text-gray-500">key: </span><span className="font-mono">{maskKey(form.accessKeyId)}</span></div>
                <div><span className="text-gray-500">region: </span><span className="font-mono">{form.region}</span></div>
                <div><span className="text-gray-500">secret: </span><span className="font-mono">{form.secretName}</span></div>
              </div>
            )}
          </div>
        ) : (
          /* ── Manual fields ── */
          <>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Access Key ID</label>
              <input
                type="text"
                value={form.accessKeyId}
                onChange={e => set('accessKeyId', e.target.value)}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                className="w-full font-mono text-sm"
                autoComplete="off"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Secret Access Key</label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={form.secretAccessKey}
                  onChange={e => set('secretAccessKey', e.target.value)}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className="w-full font-mono text-sm pr-10"
                  autoComplete="off"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  tabIndex={-1}
                >
                  {showSecret ? (
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
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Region</label>
              <select
                value={form.region}
                onChange={e => set('region', e.target.value)}
                className="w-full"
                required
              >
                {AWS_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Secret Name</label>
              <input
                type="text"
                value={form.secretName}
                onChange={e => set('secretName', e.target.value)}
                placeholder="my-app/credentials"
                className="w-full font-mono text-sm"
                required
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || (pasteMode && (!pastePopulated || !!pasteError))}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium text-sm py-2 rounded-md mt-2"
        >
          {busy ? 'Connecting…' : 'Connect'}
        </button>
      </form>

      <Footer />
    </div>
  )
}

function Header() {
  return (
    <div className="mb-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600/20 rounded-xl mb-4">
        <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-gray-100">AWS Secrets Editor</h1>
      <p className="mt-1 text-sm text-gray-400">Connect to your AWS account to get started</p>
    </div>
  )
}

function Footer() {
  return (
    <p className="mt-4 text-xs text-gray-600 text-center">
      Credentials are stored in session storage — cleared on logout or tab close.
    </p>
  )
}
