# Hermes Connect Quickstart

Status: live local-operator helper for Boreal's connected-agent flow.

This is the fastest current path for connecting a local Hermes runtime to Boreal chat without guessing the HTTP contract by hand.

## Goal

Get from:

- Hermes running locally
- Boreal deployed on Vercel

To:

- user sends a message in Boreal chat
- Hermes processes it
- Hermes reply lands in the same Boreal thread

## Fastest Working Path

1. Start the local bridge:

```powershell
cd next-app
npm run agent:bridge:hermes
```

2. Expose the printed `executorUrl` publicly with a tunnel or public host.

3. Open Boreal chat.

4. Click `Connect agent`.

5. Choose:

- `Use as my agent`
- connector: `HTTP executor`

6. Paste the public tunnel URL ending in `/boreal/chat`.

7. Save.

8. Send `hi`.

If the bridge is active, Boreal should show a Hermes reply in the same thread.

## Bridge Modes

### Echo mode

Default.  No extra setup.

It simply returns:

```json
{
  "assistantMessage": "Hermes heard: <your message>"
}
```

This is the fastest way to prove Boreal chat routing works before wiring the real Hermes runtime.

### Command mode

Use this when Hermes can be driven by a local shell command.

Set:

```powershell
$env:HERMES_BRIDGE_MODE="command"
$env:HERMES_BRIDGE_COMMAND="wsl.exe -d Ubuntu -- python3 /home/you/hermes_worker.py"
```

Then run:

```powershell
cd next-app
npm run agent:bridge:hermes
```

The bridge sends the Boreal payload JSON to Hermes over `stdin`.

Expected Hermes worker behavior:

- read JSON from `stdin`
- inspect `message`
- write either:
  - plain text
  - or JSON with `assistantMessage`

### Forward mode

Use this when Hermes already exposes its own local HTTP endpoint.

Set:

```powershell
$env:HERMES_BRIDGE_MODE="forward"
$env:HERMES_BRIDGE_FORWARD_URL="http://127.0.0.1:9000/boreal/chat"
```

Then run:

```powershell
cd next-app
npm run agent:bridge:hermes
```

## Exact HTTP Contract

Boreal sends `POST` JSON to your `HTTP executor URL`.

Important fields:

- `message`
- `requester`
- `conversation`
- `agent`
- `boreal.auth.bearerToken`
- `boreal.endpoints.requestPost`
- `boreal.callbacks.statusUrlTemplate`
- `boreal.callbacks.evidenceUrlTemplate`
- `boreal.callbacks.heartbeatUrlTemplate`

See:

- `GET /sample-request` on the bridge
- `next-app/lib/boreal/external-agents/runtime.ts`

## Accepted Response Shapes

Plain text:

```text
Hermes is connected.
```

JSON:

```json
{
  "assistantMessage": "Hermes is connected."
}
```

Also accepted:

```json
{
  "message": "Hermes is connected."
}
```

## Short Prompt

Paste this into Hermes if it can follow operator instructions:

```text
Connect yourself to Boreal. Accept POST JSON at /boreal/chat. Read the `message` field. Return plain text or JSON with `assistantMessage`. If Boreal sends callback URLs for a private request, use the Bearer token it provides for status, evidence, and heartbeat updates.
```

## What to Expect

When connected as `Use as my agent`:

- user still types in Boreal chat
- Hermes processes the message
- reply appears in the same Boreal chat thread
- Boreal remains the system of record

When connected as `Auto fallback`:

- Boreal tries Hermes first
- if Hermes fails, Boreal replies

When set to `No agent`:

- no active brain
- chat should not continue through a connected runtime

## Limits

Current live limits:

- no UI `Test connection` button yet
- no quick token claim flow yet
- no inbox-worker sidecar bridge yet
- live Vercel needs a public URL, not `localhost`

## Verification

Run:

```powershell
cd next-app
npm run smoke:hermes-bridge
```

This verifies the local bridge contract directly.
