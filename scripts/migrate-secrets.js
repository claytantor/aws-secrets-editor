#!/usr/bin/env node

/**
 * Migrate secrets in AWS Secrets Manager
 * This script validates the current format and creates a backup version.
 * Usage:
 *   node migrate-secrets.js --profile <profile-name> --name <secret-name> [--dry-run]
 *   node migrate-secrets.js --region <region> --access-key <key> --secret-key <secret> --name <secret-name> [--dry-run]
 */

import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { fromIni } from '@aws-sdk/credential-provider-ini'
import { randomUUID } from 'node:crypto'

function parseArgs(args) {
  const result = {}
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2).split('=')[0]
      const value = arg.includes('=') ? arg.split('=')[1] : args[args.indexOf(arg) + 1]
      result[key] = value
    }
  })
  return result
}

function makeClient(args) {
  const params = {
    region: args.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1'
  }

  if (args.profile) {
    params.credentials = fromIni({ profile: args.profile })
  } else if (args['access-key'] && args['secret-key']) {
    params.credentials = {
      accessKeyId: args['access-key'],
      secretAccessKey: args['secret-key']
    }
  } else {
    throw new Error('Must provide either --profile or --access-key and --secret-key')
  }

  return new SecretsManagerClient(params)
}

function validateEntries(entries) {
  const errors = []
  const warnings = []

  if (!entries || typeof entries !== 'object') {
    return { valid: false, errors: ['Secret must be a JSON object'], warnings: [] }
  }

  const entryNames = Object.keys(entries)
  if (entryNames.length === 0) {
    warnings.push('Secret is empty (no entries)')
    return { valid: true, errors: [], warnings }
  }

  for (const [name, entry] of Object.entries(entries)) {
    if (!entry || typeof entry !== 'object') {
      errors.push(`Entry "${name}" must be an object`)
      continue
    }

    // Check for expected fields (all optional)
    const fields = ['title', 'username', 'password', 'url', 'notes']
    const hasAnyField = fields.some(f => entry[f] !== undefined)

    if (!hasAnyField) {
      warnings.push(`Entry "${name}" has no standard fields (title, username, password, url, notes)`)
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.name) {
    console.error('Error: --name is required')
    console.error('Usage:')
    console.error('  node migrate-secrets.js --profile <profile> --name <secret-name> [--dry-run]')
    console.error('  node migrate-secrets.js --region <region> --access-key <key> --secret-key <secret> --name <secret-name> [--dry-run]')
    process.exit(1)
  }

  const client = makeClient(args)
  const isDryRun = args['dry-run'] === 'true' || args['dry-run'] === 'yes'

  console.log(`Checking secret: ${args.name}`)
  console.log(`Region: ${args.region || process.env.AWS_REGION || 'us-east-1'}`)
  console.log(`Profile: ${args.profile || '(explicit credentials)'}`)
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('---')

  try {
    const getCommand = new GetSecretValueCommand({
      SecretId: args.name
    })

    const response = await client.send(getCommand)

    if (!response.SecretString) {
      console.log('Secret exists but has no string value')
      console.log('Creating new secret with empty entries...')

      if (isDryRun) {
        console.log('[DRY RUN] Would create new secret with {}')
      } else {
        const putCommand = new PutSecretValueCommand({
          SecretId: args.name,
          SecretString: '{}'
        })
        await client.send(putCommand)
        console.log('Created new secret with empty entries')
      }

      return
    }

    let entries
    try {
      entries = JSON.parse(response.SecretString)
    } catch (e) {
      console.error('Error: Secret is not valid JSON')
      process.exit(1)
    }

    const validation = validateEntries(entries)

    if (!validation.valid) {
      console.log('Validation FAILED:')
      validation.errors.forEach(e => console.log(`  [ERROR] ${e}`))
      process.exit(1)
    }

    console.log('Validation PASSED')

    if (validation.warnings.length > 0) {
      console.log('Warnings:')
      validation.warnings.forEach(w => console.log(`  [WARN] ${w}`))
    }

    const entryCount = Object.keys(entries).length
    console.log(`Found ${entryCount} entry/entries`)

    if (isDryRun) {
      console.log('---')
      console.log('[DRY RUN] No changes made')
      return
    }

    // Create a backup by putting the same data with a new version
    // AWS Secrets Manager automatically tracks versions
    const putCommand = new PutSecretValueCommand({
      SecretId: args.name,
      SecretString: response.SecretString,
      ClientRequestToken: randomUUID()
    })

    const putResponse = await client.send(putCommand)

    console.log('---')
    console.log('Backup created:')
    console.log(`  Version ID: ${putResponse.VersionId}`)
    console.log('  (AWS Secrets Manager maintains version history automatically)')
    console.log('Migration complete!')

  } catch (err) {
    const code = err.name || err.Code || ''
    if (code === 'ResourceNotFoundException') {
      console.error(`Error: Secret "${args.name}" not found`)
      console.error('Creating new secret...')

      if (isDryRun) {
        console.log('[DRY RUN] Would create new secret with {}')
      } else {
        const putCommand = new PutSecretValueCommand({
          SecretId: args.name,
          SecretString: '{}'
        })
        await client.send(putCommand)
        console.log('Created new secret with empty entries')
      }

      return
    }

    if (code === 'AccessDeniedException' || code === 'UnrecognizedClientException') {
      console.error('Error: Access denied. Check your AWS credentials and permissions.')
    } else {
      console.error(`Error: ${err.message}`)
    }
    process.exit(1)
  }
}

main()
