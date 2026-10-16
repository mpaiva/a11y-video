# Review checklist — what the film review must catch

`film-reviewer` reviews every draft second by second against this list before the requester sees
it. **P0 must be fixed** before the draft is shown; P1 is fixed in the same pass when cheap; P2 is
polish. Every item here was a real finding on a Tallgrass draft.

## P0 — the customer would read it as a bug, or it breaks a rule

| Finding | Where it happened | Fix |
|---|---|---|
| **After-state flash** — a finished state shows before the story reaches it | Draft 1, 11.2–11.6 s: "1 of 2 done", "Completed (2)" and a "Removed" section flashed for 0.4 s before the 0-of-N portal | Start the clip on the before state; take in-points from marks |
| **Caught-up flash** between two clips | Draft 1, 7.23–7.50 s: the "You're caught up" home screen for 8 frames between sign-in and "1 of 3" | End the sign-in clip before the home screen loads |
| **Hidden count the voice points at** | Draft 1, 2:19: "I can see how many match" while "4 match" sat half behind the drawer footer | Re-capture with the count scrolled into view, or drop the line |
| **Blank frames** as a drawer or dialog closes | Draft 3, 21.6 s, 23.2 s, 41.1 s: the screen went to an empty page for 2–3 frames | End clips before the blank; split around it |
| **Loading skeleton frame** | Draft 3, 54.83 s: one skeleton frame between list and course page | Split the clip to skip it |
| **Page scrolls under a transition** | Draft 2, 53.5 s: the admin page jumped to the top just before the phone grew | Hold a still of the unscrolled frame during the transition |
| **Contradictory counts, dates or states** | "1 of 2" in a three-course program; phone "Due Oct 6" against schedule "due Oct 4"; "Queued" after the opening showed him doing the course | Fix the fixture (`fixture.md`), then re-capture |
| **Story-order spoiler** | Draft 5 order put the assignment list (Caleb "2 of 3") before he finished course two | Reframe or reorder |
| **Wrong product term or label** | "Hired Sep 20" / "Hire date" on screen with a start-date anchor | Use footage with the right label; report the label bug |
| **Debug overlay** | The palm-tree / TanStack devtools badge | Hide it in the recorder overlay |
| **Test clutter** | CCST/IT catalog items, "Demo" and "Recording take" templates | Avoid the view; never rename into invented content |
| **Voice says what the screen does not show** | "We'll email you" with no delivered email; "Four people match" without the count | Change the line or the footage |
| **Rule broken** | End card, question to the viewer, "Thanks for watching", hype line, presenter acting as the worker | Follow `narration.md` |

## The freeze rule (pass/fail)

A freeze longer than **1.5 s at −90 dB** is a **P1** unless the EDL marks that span as an
intentional hold: a still clip, a clip with `"hold": true`, or a `holds` entry (a narrated hold,
with its `why`). `tools/demo-video/qa.sh <video> <out> <edl>` prints every freeze as OK (with the
hold that covers it) or P1 (with the seconds not covered), and exits 1 when any P1 freeze remains.
The −60 dB pass is informational only: it counts cursor-only motion as frozen.

Example — in the Tallgrass cut, the course page sits still from 71.2 to 74.5 s before the Start
tap, while "He opens it in Skillsoft" plays. That is a deliberate narrated hold, so the worked
example's EDL lists it in `holds` and `qa.sh` passes. Unlisted, the same freeze is a P1.

## P1 — weak but shippable

- A freeze that breaks the freeze rule above.
- Voice more than about 0.5 s early or late against the event it describes (for example "He's
  finished it" 2.3 s after the completed state appeared).
- Text the narration points at below about 14 px at 1080p (phone progress lines at 12 px needed a
  push-in).
- A section the viewer will skim (the course-adding sequence at 0:16–0:23) — cut it.
- Loudness jumps between lines of more than about 2 LU.
- Jump cuts inside one screen that hide a step the narration mentions.

## P2 — polish

- Zooms that crop labels ("earning" for "Learning", "Downl" for "Download list").
- Low-contrast caption, brief loading skeletons in transitions the narration does not point at,
  hover tooltips starting just before a cut.

## How to check

- 1 frame per second over the whole film, tiled into contact sheets.
- 10 fps strips within ±0.5 s of every cut in the EDL.
- `freezedetect` at `n=-60dB:d=1.5` (informational) and `n=-90dB:d=1.5` (the freeze rule).
- A transcript compared with the script: no spoken audio tags, no clipped words, every line present.
- Native-resolution crops for every number, date and label the narration names.

`tools/demo-video/qa.sh` produces the strips, contact sheets, freeze tables, decode check and
transcript in one run.
