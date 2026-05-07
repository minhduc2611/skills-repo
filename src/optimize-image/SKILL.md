---
name: optimize-image
description: >-
  Converts a local image file to WebP with EXIF-based rotation, optional
  downscale to fit inside 1500×1500 (no upscale), and quality 80. Uses Deno +
  sharp via the bundled one-shot shell entrypoint. Use when the user needs a
  single image optimized for web, WebP output, or resizing to match the blog
  migration / HubSpot upload pipeline image rules.
---

# Optimize image (WebP)

## When to use

- User wants **one file** converted to **`.webp`** with the same constraints as `hs-upload-images` (max dimension 1500, quality 80, rotate by EXIF).
- User asks to **run the optimizer**, **prepare an image for HubSpot/web**, or **match blog-migration image processing** without the full upload script.

## How to run (required path)

All runnable assets live in **`SKILL_DIR/scripts/`** where **`SKILL_DIR`** = `.claude/skills/optimize-image/`.

1. **Preferred (sets up Deno + caches deps + runs; does not create `deno.lock`):**

   ```bash
   cd SKILL_DIR/scripts
   ./setup-and-run.sh <input-image> <output.webp>
   ```

   Or from anywhere:

   ```bash
   /absolute/path/to/.claude/skills/optimize-image/scripts/setup-and-run.sh <input-image> <output.webp>
   ```

2. **If Deno is already installed** (after deps are cached):

   ```bash
   cd SKILL_DIR/scripts
   deno run -A --no-lock --config=deno.json script.ts <input-image> <output.webp>
   ```

Do **not** use Node/tsx for this skill; **`script.ts` is Deno-only** (`npm:sharp` import).

## Behavior (fixed in `script.ts`)

| Step | Rule |
|------|------|
| Orientation | Apply EXIF rotation via sharp (`rotate()` with no manual angle). |
| Resize | Only if width **or** height exceeds **1500px**: fit **inside** 1500×1500, preserve aspect, **no enlargement**. |
| Encode | **WebP**, quality **80**. |
| I/O | Read `<input-image>` from disk; write `<output.webp>` to disk. |

## Arguments and help

- **Required:** two paths — input file, output path (typically ending in `.webp`).
- **Help:** `deno run -A --no-lock --config=deno.json script.ts --help` from `scripts/` (or `./setup-and-run.sh --help`). **`--no-lock`** avoids writing a lockfile.

## Skill layout

| Path | Role |
|------|------|
| `scripts/setup-and-run.sh` | Installs Deno if missing, `deno cache`, runs `script.ts`; uses `--no-lock` on cache and run. |
| `scripts/script.ts` | Deno entry: resize + WebP encode. |
| `scripts/deno.json` | Deno config (`nodeModulesDir` for npm `sharp`, **`lock: false`**). |
| `SKILL.md` | This skill description. |

## Notes for the agent

- **`setup-and-run.sh` needs network** on first run (install Deno, fetch npm packages). Subsequent runs are mostly offline if cache is warm.
- **Input/output paths** can be absolute or relative to the current working directory when invoking the shell script.
- **No `deno.lock` is generated** by design (`deno.json` + `--no-lock` in the shell and documented manual `deno run`).
- If conversion fails, surface **stderr** from Deno/sharp; common issues: corrupt image, wrong path, or Deno/npm permission problems in restricted environments.
