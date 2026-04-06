import { Router } from 'express'
import { getSecret, putSecret } from '../services/secretsManager.js'

const router = Router()

function credentialsFromHeaders(req) {
  return {
    accessKeyId: req.headers['x-aws-access-key-id'],
    secretAccessKey: req.headers['x-aws-secret-access-key'],
    region: req.headers['x-aws-region'],
    secretName: req.headers['x-aws-secret-name']
  }
}

function validateCredentials(creds) {
  return creds.accessKeyId && creds.secretAccessKey && creds.region && creds.secretName
}

router.get('/', async (req, res) => {
  const creds = credentialsFromHeaders(req)
  if (!validateCredentials(creds)) {
    return res.status(400).json({ error: 'Missing AWS credential headers' })
  }

  try {
    const entries = await getSecret(creds)
    return res.json({ entries })
  } catch (err) {
    const code = err.name || err.Code || ''
    if (code === 'ResourceNotFoundException') {
      return res.status(404).json({ error: 'Secret not found' })
    }
    if (
      code === 'AccessDeniedException' ||
      code === 'UnrecognizedClientException' ||
      code === 'InvalidClientTokenId' ||
      code === 'AuthorizationError'
    ) {
      return res.status(401).json({ error: 'Credentials may have expired or lack permission' })
    }
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
})

router.put('/', async (req, res) => {
  const creds = credentialsFromHeaders(req)
  if (!validateCredentials(creds)) {
    return res.status(400).json({ error: 'Missing AWS credential headers' })
  }

  const { entries } = req.body
  if (!entries || typeof entries !== 'object') {
    return res.status(400).json({ error: 'Invalid entries payload' })
  }

  try {
    const versionId = await putSecret(creds, entries)
    return res.json({ success: true, versionId })
  } catch (err) {
    const code = err.name || err.Code || ''
    if (
      code === 'AccessDeniedException' ||
      code === 'UnrecognizedClientException' ||
      code === 'InvalidClientTokenId' ||
      code === 'AuthorizationError'
    ) {
      return res.status(401).json({ error: 'Credentials may have expired or lack permission' })
    }
    return res.status(500).json({ error: err.message || 'Unknown error' })
  }
})

export default router
