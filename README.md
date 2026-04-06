# aws-secrets-editor

A local web UI for viewing and editing secrets stored in [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/). It expects your secret to be a flat JSON object (key → `{title, username, password, url, notes}`).

## Features

- Browse, search, add, edit, and delete entries in a Secrets Manager secret
- Review a diff of your changes before saving
- Bulk import from `.env`-style `KEY=value` text
- Built-in CSPRNG password generator
- Dark-mode UI built with React + Tailwind CSS

## Security notice

This tool is designed to run **locally on your own machine**. It is not intended to be deployed on a shared or public server.

- AWS credentials are entered in the browser and sent in request headers to a local Express server. They are **never written to disk** by the server.
- Credentials are held in `sessionStorage` for the duration of the browser session and cleared when the tab is closed.
- The Express server listens on `localhost:3001` by default. Do not expose this port externally.

## Requirements

- Node.js >= 18
- AWS IAM credentials with `secretsmanager:GetSecretValue` and `secretsmanager:PutSecretValue` permissions on the target secret

## Installation

```bash
git clone https://github.com/claytantor/aws-secrets-editor.git
cd aws-secrets-editor
npm install
```

## Usage

**Development** (Vite dev server + Express with hot reload):

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and enter your AWS credentials.

**Production** (Express serves the compiled frontend):

```bash
npm run build
npm start
```

Open [http://localhost:3001](http://localhost:3001).

The `PORT` environment variable overrides the default port.

## AWS credentials

### Option 1 — manual fields

Fill in the four fields in the login form:

| Field | Description |
|-------|-------------|
| Access Key ID | IAM access key ID (`AKIA…`) |
| Secret Access Key | IAM secret access key |
| Region | AWS region (e.g. `us-east-1`) |
| Secret Name | Name or ARN of the Secrets Manager secret |

### Option 2 — paste JSON

Click **Paste JSON** in the top-right of the login form and paste a JSON object with the same four fields:

```json
{
  "accessKeyId": "AKIAIOSFODNN7EXAMPLE",
  "secretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "region": "us-east-1",
  "secretName": "my-app/credentials"
}
```

The form validates the JSON as you type, shows a preview of the parsed values, and automatically collapses to the compact credential summary once the input is valid. This is useful when you store credentials in a local file and want to paste them in quickly without retyping.

## Secret format

The secret value must be a JSON object where each key is an entry identifier and the value is an object with any of these fields:

```json
{
  "my-service": {
    "title": "My Service",
    "username": "admin",
    "password": "hunter2",
    "url": "https://example.com",
    "notes": "Production credentials"
  }
}
```

All fields are optional.

## License

MIT
