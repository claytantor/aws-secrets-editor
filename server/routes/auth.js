import { Router } from 'express'
import { getSecret } from '../services/secretsManager.js'

const router = Router()

router.post('/connect', async (req, res) => {
  const { accessKeyId, secretAccessKey, region, secretName } = req.body

  if (!accessKeyId || !secretAccessKey || !region || !secretName) {
    return res.status(400).json({ success: false, error: 'Missing required fields' })
  }

  try {
    const entries = await getSecret({ accessKeyId, secretAccessKey, region, secretName })
    const entryCount = typeof entries === 'object' ? Object.keys(entries).length : 0
    return res.json({ success: true, secretName, entryCount })
  } catch (err) {
    const code = err.name || err.Code || ''
    if (code === 'ResourceNotFoundException') {
      return res.status(404).json({ success: false, error: 'Secret not found' })
    }
    if (
      code === 'InvalidClientTokenId' ||
      code === 'SignatureDoesNotMatch' ||
      code === 'AuthorizationError' ||
      code === 'AccessDeniedException' ||
      code === 'UnrecognizedClientException'
    ) {
      return res.status(401).json({ success: false, error: 'Invalid credentials or access denied' })
    }
    return res.status(500).json({ success: false, error: err.message || 'Unknown error' })
  }
})

export default router
