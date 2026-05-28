# Storytelling as Space

An authoring tool for transforming written imagery into explorable narrative environments.

## How a space works

A **space passage** has two prose parts:

1. **Lead-in** — read as normal text (*Mirae stepped into the train car…*)
2. **Scene** — what the reader steps into; replaced on exit by lines from their interactions (*She opened the suitcase. She studied the bulletin board.*)

Set a **win condition** on one interaction (e.g. **Open** on the suitcase). When the reader performs it, the space closes and the story continues with lead-in + exploration lines, then the next fixed passage.

## Layout

One screen with collapsible panels:

- **Write** (top-left) — manuscript; click a space in the gutter to focus it
- **Preview** (bottom-left) — reader playtest for the focused space
- **Space** (right half) — parse, place objects, set win conditions

Collapse any section with the chevron in its header.

Save/load projects as JSON.

## Run locally

```bash
npm install
npm run dev
node server/index.js
```

Set `REPLICATE_API_TOKEN` in `.env` for asset generation.
