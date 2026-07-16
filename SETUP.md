# Setting Up fha-placement on a New Laptop

## 1. Install Node.js
- Go to https://nodejs.org and download the **LTS** installer for Windows.
- Run it, click Next through the defaults, then Finish.
- Verify in PowerShell:
  ```
  node -v
  npm -v
  ```

## 2. Install Git
- Go to https://git-scm.com/download/win and download/run the installer (defaults are fine).
- Verify:
  ```
  git --version
  ```
- If it says "not recognized," close and reopen PowerShell (PATH needs a refresh).

## 3. Install Claude Code
- Download from https://claude.com/claude-code and sign in with the same Anthropic account.

## 4. Clone the project
```
cd Documents
mkdir Coding
cd Coding
git clone https://github.com/jerickpsalinas/fha-placement.git
cd fha-placement
```
- If prompted, sign into GitHub in the browser window that pops up.

## 5. Copy over the environment file
- The file `.env.local` holds secret keys and is **not** in GitHub (intentionally, for security).
- Copy it manually from the old laptop (USB drive or a secure/password-manager note — not email/Slack plaintext).
- Place it at `fha-placement\.env.local` on the new laptop.
- It should contain these three variables (values are on the old laptop):
  ```
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
  ⚠️ `SUPABASE_SERVICE_ROLE_KEY` is an admin-level secret — never share it publicly or commit it to git.

## 6. Install dependencies
```
npm install
```

## 7. Run the project
```
npm run dev
```
Open http://localhost:3000 in a browser to confirm it works.

## Notes
- All project code is already pushed to GitHub (`origin/master`) as of this file's creation, so cloning gets you the latest version.
- Claude Code's saved memories (your preferences/feedback) carry over automatically once you sign into the same account on the new device — but this specific chat's history stays on the old device's app.
- Open Claude Code inside the `fha-placement` folder on the new laptop to resume working with full project context.
