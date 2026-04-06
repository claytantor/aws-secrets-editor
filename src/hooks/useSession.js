import { useState } from 'react'

const SESSION_KEY = 'aws-secrets-editor:session'

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(credentials) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(credentials))
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export function useSession() {
  const [session, setSession] = useState(loadSession)

  function connect(credentials) {
    saveSession(credentials)
    setSession(credentials)
  }

  function disconnect() {
    clearSession()
    setSession(null)
  }

  return { session, connect, disconnect }
}
