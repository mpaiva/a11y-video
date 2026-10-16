# demo-video

A Claude Code (and Codex) skill for making a 1–3 minute narrated walkthrough of a **real** flow in
any web app you can run locally, to show customers and get product feedback. It runs a gated
recipe: intake interview, capability check, script, isolated demo data, human-paced screen capture,
storyboard pick, local Kokoro voice, a HyperFrames edit (or a plain-ffmpeg cut), a second-by-second
film review and the final renders.

Nothing here is tied to one product. The worked examples come from a demo of a fictional company
in an example HR product; read them for the lessons, not the product details.

## What's in it

| Path | What it is |
|------|------------|
| `.claude/skills/demo-video/` | The skill (`SKILL.md`) and its references and templates |
| `.agents/skills/demo-video` | Symlink to the same skill, for agents that read `.agents/` |
| `.claude/agents/`, `.codex/agents/` | The `storyboarder`, `film-reviewer` and `reference-breaker` agents |
| `agents/workflow/` | The instructions those agents follow (shared by Claude Code and Codex) |
| `tools/demo-video/` | Recorder, voice, builder, cut and QA scripts (`tools/demo-video/README.md`) |

## Use it in a project

The skill and agents refer to `tools/demo-video/…` and `agents/workflow/…` relative to the project
root, so copy the five folders into the root of the project you want to film. From this repo, this
copies the committed files only (no `node_modules`, no local settings) and keeps the `.agents`
symlink:

```bash
git archive HEAD .claude .agents .codex agents tools | tar -x -C /path/to/your-project
```

It overwrites files of the same name, so merge by hand if the project already has `.claude/`,
`.codex/` or `agents/` folders. Then, in the project:

```bash
cd tools/demo-video && npm install && npx playwright install chromium
```

```bash
tools/demo-video/doctor.sh
```

`doctor.sh` (or `doctor.ps1` on Windows) lists anything else to install. Then ask the agent to
"make a demo video of <flow>". The intake asks how to run your app, which URL to record, how the
recorder signs in, and how to make isolated demo data.

## Per-project settings

Set these in the shell that records (details in `tools/demo-video/README.md`):

| Variable | What it tells the recorder |
|----------|----------------------------|
| `DEMO_ADMIN_URL` | The app's origin (default `http://localhost:3000`) |
| `DEMO_STORAGE_STATE` or `DEMO_LOGIN_PATH` | How to start signed in: a saved Playwright session, or a dev-only login route |
| `DEMO_HIDE_SELECTORS` | Debug overlays to hide in every take |
| `DEMO_CONTENT_SELECTOR` | The page's scrolling content area |

Optional project docs the skill uses when they exist: a claim register (product claims approved for
customers), workflow or jobs-to-be-done docs, and persona agents for a customer-reaction review.
