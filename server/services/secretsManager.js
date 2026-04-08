import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand
} from '@aws-sdk/client-secrets-manager'

function makeClient(credentials) {
  return new SecretsManagerClient({
    region: credentials.region.trim(),
    credentials: {
      accessKeyId: credentials.accessKeyId.trim(),
      secretAccessKey: credentials.secretAccessKey.trim()
    }
  })
}

function normalizeEntryValue(value) {
  // If value is an object with nested fields (old format), extract the password
  if (typeof value === 'object' && value !== null) {
    // Check if it's the old format with title/username/password/url/notes
    if ('password' in value) {
      return value.password
    }
    // If it's already a flat object, return as-is
    return value
  }
  return value
}

export async function getSecret(credentials) {
  const client = makeClient(credentials)
  const command = new GetSecretValueCommand({
    SecretId: credentials.secretName.trim()
  })
  const response = await client.send(command)
  const value = response.SecretString
  if (!value) throw new Error('Secret has no string value')

  const data = JSON.parse(value)

  // Normalize entries - convert old nested format to flat format
  const normalized = {}
  for (const [key, entry] of Object.entries(data)) {
    normalized[key] = normalizeEntryValue(entry)
  }

  return normalized
}

export async function putSecret(credentials, entries) {
  const client = makeClient(credentials)
  const command = new PutSecretValueCommand({
    SecretId: credentials.secretName,
    SecretString: JSON.stringify(entries)
  })
  const response = await client.send(command)
  return response.VersionId
}
