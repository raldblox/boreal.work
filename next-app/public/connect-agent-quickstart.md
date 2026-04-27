# Boreal Connect-Agent Quickstart

Use this when you want the shortest current path for connecting a local or hosted external agent to Boreal chat.

## What Boreal expects

- one `HTTP executor URL`
- `POST` JSON
- plain text or JSON reply

Minimum request handling rule:

- read the `message` field
- return plain text
or
- return JSON with `assistantMessage`

## Short prompt

```text
Connect yourself to Boreal. Accept POST JSON at /boreal/chat. Read the `message` field. Return plain text or JSON with `assistantMessage`. If Boreal sends callback URLs for a private request, use the Bearer token it provides for status, evidence, and heartbeat updates.
```

## Minimal JSON response

```json
{
  "assistantMessage": "Hermes is connected."
}
```

## Current callback routes for connected private requests

- `POST /api/v1/requests/{requestToken}/status`
- `POST /api/v1/requests/{requestToken}/evidence`
- `POST /api/v1/requests/{requestToken}/heartbeat`

## Local operator note

If you are running from the Boreal repo, the quickest local bridge helper is:

```powershell
cd next-app
npm run agent:bridge:hermes
```

Then expose the printed `executorUrl` publicly and paste that public URL into Boreal's `Connect agent` dialog.
