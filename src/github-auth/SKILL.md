---
name: github-auth
description: >-
  Maps GH_TOKEN and GITHUB_SECRET_KEY, authenticates gh CLI, and runs normal
  git clone/commit/push against GitHub. Use when the agent or environment has
  GH_TOKEN or GITHUB_SECRET_KEY, needs gh auth login / setup-git, or must push
  to a GitHub repo without regenerating a token just because the env var name
  differs.
---

# GitHub auth

If only `GITHUB_SECRET_KEY` exists, map it to `GH_TOKEN`:

```bash
export GH_TOKEN="${GH_TOKEN:-$GITHUB_SECRET_KEY}"
```

Verify:

```bash
gh auth status
```

For Git operations:

```bash
gh auth setup-git
```

Then use Git normally:

```bash
git clone https://github.com/minhduc2611/minh-kim-cms.git
git add .
git commit -m "Update files"
git push
```

Never print, log, commit, or expose the token.
