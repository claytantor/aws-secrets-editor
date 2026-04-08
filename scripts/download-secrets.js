#!/usr/bin/env node

/**
 * Download secrets from AWS Secrets Manager
 * Usage:
 *   node download-secrets.js --profile <profile-name> --name <secret-name> [--region <region>] [--output <file>]
 *   node download-secrets.js --region <region> --access-key <key> --secret-key <secret> --name <secret-name> [--output <file>]
 */

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { fromIni } from '@aws-sdk/credential-provider-ini'

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
  // Require region to be explicitly provided - don't guess
  if (!args.region) {
    console.error('Error: --region is required')
    console.error('Usage:')
    console.error('  node download-secrets.js --profile <profile> --name <secret-name> --region <region> [--output <file>]')
    console.error('  node download-secrets.js --region <region> --access-key <key> --secret-key <secret> --name <secret-name> [--output <file>]')
    process.exit(1)
  }

  const params = { region: args.region }

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

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (!args.name) {
    console.error('Error: --name is required')
    console.error('Usage:')
    console.error('  node download-secrets.js --profile <profile> --name <secret-name> [--output <file>]')
    console.error('  node download-secrets.js --region <region> --access-key <key> --secret-key <secret> --name <secret-name> [--output <file>]')
    process.exit(1)
  }

  const client = makeClient(args)
  const command = new GetSecretValueCommand({
    SecretId: args.name
  })

  try {
    const response = await client.send(command)

    if (!response.SecretString) {
      throw new Error('Secret has no string value')
    }

    let entries
    try {
      entries = JSON.parse(response.SecretString)
    } catch (e) {
      console.error('Error: Secret is not valid JSON')
      process.exit(1)
    }

    const output = args.output ? JSON.stringify(entries, null, 2) : JSON.stringify(entries, null, 2)

    if (args.output) {
      const fs = await import('fs')
      fs.writeFileSync(args.output, output)
      console.log(`Secret downloaded to ${args.output}`)
    } else {
      console.log(output)
    }
  } catch (err) {
    const code = err.name || err.Code || ''
    if (code === 'ResourceNotFoundException') {
      console.error(`Error: Secret "${args.name}" not found`)
    } else if (code === 'AccessDeniedException' || code === 'UnrecognizedClientException') {
      console.error('Error: Access denied. Check your AWS credentials and permissions.')
    } else {
      console.error(`Error: ${err.message}`)
    }
    process.exit(1)
  }
}

main()
