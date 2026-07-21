# Auto-Deploy Pipeline (GitHub → n8n → VPS)

Goal: pushing to `master` on GitHub automatically rebuilds and restarts the app
on the Hostinger VPS — no manual SSH.

```
git push  ──►  GitHub webhook  ──►  n8n workflow  ──►  SSH runs deploy.sh  ──►  PM2 restart
```

This folder contains the **repo-side** pieces:

| File | What it is |
| --- | --- |
| `deploy.sh` | The script that actually deploys on the VPS (pull → `npm ci` → build → `pm2 restart`). Safe to run by hand too. |
| `n8n-workflow.json` | An importable n8n workflow: webhook → branch filter → SSH → respond. |
| `README.md` | This guide. |

---

## What only *you* can do (needs server / account access)

These steps can't live in the repo — they require the running n8n instance, the
VPS, and the GitHub repo settings:

1. **Put `deploy.sh` on the VPS and make it executable**
   ```bash
   cd /docker/fha-placement        # your actual repo path
   chmod +x deploy/deploy.sh
   # sanity check — run it once by hand:
   ./deploy/deploy.sh
   ```
   If your repo path or PM2 process name differ, edit the `APP_DIR` /
   `PM2_PROCESS` defaults at the top of `deploy.sh` (or export them).

2. **Import the workflow into n8n**
   - n8n → Workflows → Import from File → `n8n-workflow.json`.
   - Open the **SSH** node and attach an SSH credential (host = VPS IP, user,
     and a private key that's authorized on the VPS). Replace the placeholder
     `REPLACE_WITH_SSH_CREDENTIAL_ID`.
   - Activate the workflow. Copy the **Production webhook URL** from the
     webhook node (looks like `https://<your-n8n>/webhook/fha-deploy`).

3. **Set the shared secret (required — see "Webhook security" below).**

4. **Add the webhook to GitHub**
   - Repo → Settings → Webhooks → Add webhook.
   - Payload URL = the n8n production webhook URL.
   - Content type = `application/json`.
   - Secret = the same secret configured in n8n.
   - Events = **Just the push event**.

5. **Test**: push a trivial commit to `master` and confirm the VPS rebuilds
   (watch `pm2 logs fha-placement`, or n8n's execution log).

---

## Webhook security (HMAC signature verification)

The workflow's **Verify GitHub signature** node recomputes
`HMAC-SHA256(secret, rawBody)` and constant-time compares it against GitHub's
`X-Hub-Signature-256` header. Unsigned or forged requests throw before the SSH
node runs, so knowing the webhook URL is no longer enough to trigger a deploy.

**Setup — the secret must match on both sides:**

1. Generate one:
   ```bash
   openssl rand -hex 32
   ```
2. **In n8n** — either (preferred) set `FHA_DEPLOY_SECRET` in the n8n
   container's environment and restart it, or open the **Verify GitHub
   signature** node and replace `REPLACE_WITH_WEBHOOK_SECRET` with the value.
   The node reads the env var first and falls back to the inline constant.
   > Keep the real secret out of this repo — the committed file only ever holds
   > the placeholder.
3. **In GitHub** — paste the same value into the webhook's **Secret** field.

**Requirements / gotchas:**

- The Webhook node must keep **Raw Body** enabled (`options.rawBody: true`).
  The signature covers the exact bytes GitHub sent; re-stringifying parsed JSON
  does not reliably round-trip (unicode in commit messages will break it).
- The Code node uses Node's `crypto`. If n8n reports that `require` is not
  allowed, set `NODE_FUNCTION_ALLOW_BUILTIN=crypto` on the n8n container and
  restart.
- **Rotating the secret:** update it in n8n first, then in GitHub. Pushes in
  between will be rejected (and simply won't deploy) until both match.

## Other hardening

- **Least-privilege SSH.** Use a dedicated deploy user/key that can only run the
  deploy (consider a forced command in `authorized_keys`).
- **Branch filter is already in place** — the `Only master branch` node drops
  pushes to other branches so feature branches don't deploy.

## Notes

- `deploy.sh` uses `flock` so two quick pushes can't build on top of each other,
  and it no-ops when the VPS is already at the latest commit.
- It runs `git reset --hard origin/master` — the VPS checkout is treated as
  disposable/build-only. Never edit files directly on the server; they'll be
  overwritten on the next deploy.
- This replaces the manual command documented in the build order:
  `git pull && npm install && npm run build && pm2 restart fha-placement`.
