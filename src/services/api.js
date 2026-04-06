/**
 * API service — credentials are passed per-request, never stored server-side.
 */

function credentialHeaders(creds) {
  return {
    'x-aws-access-key-id': creds.accessKeyId,
    'x-aws-secret-access-key': creds.secretAccessKey,
    'x-aws-region': creds.region,
    'x-aws-secret-name': creds.secretName
  }
}

export async function connect({ accessKeyId, secretAccessKey, region, secretName }) {
  const res = await fetch('/api/auth/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessKeyId, secretAccessKey, region, secretName })
  })
  return res.json()
}

export async function fetchSecret(creds) {
  const res = await fetch('/api/secret', {
    headers: credentialHeaders(creds)
  })
  if (res.status === 401) {
    const data = await res.json()
    throw Object.assign(new Error(data.error || 'Unauthorized'), { status: 401 })
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function saveSecret(creds, entries) {
  const res = await fetch('/api/secret', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...credentialHeaders(creds)
    },
    body: JSON.stringify({ entries })
  })
  if (res.status === 401) {
    const data = await res.json()
    throw Object.assign(new Error(data.error || 'Unauthorized'), { status: 401 })
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return res.json()
}
