# Storytelling as Space

An authoring tool for transforming written imagery into explorable narrative environments.

Authors work as directors: extract **props** from scene prose, **stage** them in a spatial vignette, tune **blocking**, and define **interaction cues** that produce performance lines on exit.

## How a spatial vignette works

A **spatial vignette** has two prose parts:

1. **Lead-in** (entrance prose) — read as normal text (*Mirae stepped into the train car…*)
2. **Scene** — what the reader steps into; replaced on exit by performance lines from their cues (*She opened the suitcase. She studied the bulletin board.*)

Set an **exit cue** on one interaction (e.g. **Open** on the suitcase). When the reader performs it, the vignette closes and the story continues with lead-in + performance lines, then the next fixed passage.

### Theatrical vocabulary

| Term | Meaning |
|------|---------|
| **Props** | Objects extracted from prose and staged in the vignette |
| **Blocking** | Collision settings that shape how the reader moves through the space |
| **Interaction cues** | Buttons that appear near props; each reveals a performance line |
| **Exit cue** | The cue that closes the vignette and advances the story |
| **Rehearsal** | Author playtest in Preview, where the reader enacts a partial performance script |

## Layout

One screen with collapsible panels:

- **Write** (top-left) — manuscript; click a vignette in the gutter to focus it
- **Preview** (bottom-left) — reader rehearsal for the focused vignette
- **Scenography** (right half) — extract props, stage & block, define cues

Collapse any section with the chevron in its header.

Save/load projects as JSON.

## Run locally

```bash
npm install
npm run dev
node server/index.js
```

Set `REPLICATE_API_TOKEN` in `.env` for prop image generation.
