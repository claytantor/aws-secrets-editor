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

export async function getSecret(credentials) {
  const client = makeClient(credentials)
  const command = new GetSecretValueCommand({
    SecretId: credentials.secretName.trim()
  })
  const response = await client.send(command)
  const value = response.SecretString
  if (!value) throw new Error('Secret has no string value')
  return JSON.parse(value)
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
