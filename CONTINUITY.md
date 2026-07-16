# Continuity Prompt — fha-placement laptop migration

Paste this to Claude Code on the new laptop to pick up where we left off.

---

I'm continuing a project migration from my old laptop to this new one. Here's the context:

**Project**: `fha-placement` — a Next.js app using Supabase (auth, database), Tailwind CSS, Zod, and Papaparse. Repo: https://github.com/jerickpsalinas/fha-placement

**What happened on the old laptop, in order:**
1. I asked whether I could just copy the project files to a new laptop to continue work.
2. Claude explained the project is git-tracked, so pushing to GitHub and cloning is cleaner than a raw file copy — and flagged that `.env.local` (containing Supabase secret keys) is gitignored and needs to be copied manually since it won't come over via git.
3. We reviewed uncommitted local changes on the old laptop: `.claude/settings.local.json` (Claude Code local permissions) and `tsconfig.tsbuildinfo` (TypeScript build cache) — both housekeeping files, not real code changes.
4. We committed those two files (commit `7d7e5a1`, "chore: update local tooling settings and build cache") and pushed to `origin/master`. The repo is now fully up to date.
5. We started the new-laptop setup: installing Node.js and Git, verifying versions, and were about to clone the repo with:
   ```
   git clone https://github.com/jerickpsalinas/fha-placement.git
   ```

**What still needs to happen on this new laptop:**
- [ ] Confirm Node.js and Git are installed (`node -v`, `npm -v`, `git --version`)
- [ ] Clone the repo (see command above)
- [ ] Manually copy over `.env.local` from the old laptop — it holds three secrets:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (admin-level secret — never commit or share this)
- [ ] Run `npm install`
- [ ] Run `npm run dev` and confirm the app loads at http://localhost:3000
- [ ] Once confirmed working, the old laptop can be shut down — all code is safely on GitHub.

Please pick up from the clone step and walk me through the rest, step by step, as if I don't know anything technical.
