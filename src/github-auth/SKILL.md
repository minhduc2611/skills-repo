---
name: github-auth
description: >-
  Maps GH_TOKEN and GITHUB_SECRET_KEY, authenticates gh CLI, and runs normal
  git clone/commit/push against GitHub. Use when the agent or environment has
  GH_TOKEN or GITHUB_SECRET_KEY, needs gh auth login / setup-git, or must push
  to a GitHub repo without regenerating a token just because the env var name
  differs.
---

# GitHub auth (GH_TOKEN ↔ GITHUB_SECRET_KEY)

No problem—you do **not** need to regenerate the token just because the environment-variable name is different.

If your token is currently in `GH_TOKEN`:

```bash
export GITHUB_SECRET_KEY="$GH_TOKEN"
```

Since `gh` expects `GH_TOKEN`, authenticate Git with:

```bash
export GH_TOKEN="$GITHUB_SECRET_KEY"

gh auth login --hostname github.com --with-token <<< "$GH_TOKEN"
gh auth setup-git
```

Then use the repository normally:

```bash
git clone https://github.com/minhduc2611/minh-kim-cms.git
cd minh-kim-cms

git add .
git commit -m "Update files"
git push
```

If your AI agent specifically expects `GITHUB_SECRET_KEY`, configure that variable in the agent, but keep the `GH_TOKEN` assignment for GitHub CLI compatibility:

```bash
export GITHUB_SECRET_KEY="your-token"
export GH_TOKEN="$GITHUB_SECRET_KEY"
```
