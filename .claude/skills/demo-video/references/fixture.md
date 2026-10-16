# Demo data — fixture rules and traps

The video can only show what the database really holds, so the story is built in the data first.
Every trap below put a contradiction on screen in a Tallgrass draft.

## Isolation

- Run the demo stack against an **isolated** Postgres (the Tallgrass demo used its own compose
  project on port 55499) — never the shared dev database, never staging or production.
- Make **one database copy per story state** and leave the originals untouched. Tallgrass used
  `film_v6_before` (Caleb at 1 of 3, second course assigned and due Oct 4) and `film_v6_after`
  (2 of 3, caught up, more training Oct 4). Name copies `<prefix>_<version>_<state>`.
- Run any new migrations on the copies only. If a new table lacks the app role's grants, apply
  the normal local grants to that table only — never disable row-level security or append-only
  protections.
- **Before every take, prove the port → database mapping** (each running process's
  `DATABASE_NAME`). A take recorded against the wrong copy shows the wrong state.
- Record a manifest: what was seeded, which completions were replayed, which copy each take used.

## Who can see training

- A training rule assigns only people who already have **portal access**, and in the product only
  onboarding creates it. A person who never onboarded is skipped ("No portal access yet").
  For a story about new hires, put the demo people through onboarding. A seed script that creates
  access directly is demo setup, not a product path — never narrate it as one.
- The rule's "Assign when: After onboarding finishes" holds training until the packet closes.
- Rules have no exclude operator; one condition can replace a job-title exclusion list only when
  the data marks the group in a field (department, location, employment type).

## Completions

- Completions **carry forward** into a new program: a person who finished a course elsewhere shows
  it complete in the new one. The course completed on camera must be one the person has not done.
- Do not invent vendor completions. Tallgrass replayed previously verified Percipio completion
  facts against rebuilt history using the application's own appliers, and said so in the
  provenance notes.
- Completion timestamps ("Finished September 29, 2026 at 11:47 PM") show on some screens. Decide
  per demo whether they help; if the admin side is dated a day later, either keep timestamps off
  screen or make the story's "today" consistent.

## Contradictions a customer reads as bugs

- **Counts that do not add up:** a three-course program showing "1 of 2 done".
- **Dates that do not reconcile:** phone "Due Oct 6" against the schedule's "due Oct 4". Compute
  every on-screen date from the start date + release day + days to finish before recording.
- **Title collisions with synthetic history:** older synthetic overdue items titled "Active
  Shooter Event…" next to the new "Incident Preparedness: Active Shooter Training" looked like
  duplicate assignments. Move synthetic history to unrelated topics.
- **Different program in the overdue list:** seed the overdue example from the same program the
  video just built.
- **States out of story order:** "Queued" or "Not assigned" for someone the opening already showed
  doing the course.
- **Test clutter:** CCST/IT courses in the catalog grid, "Demo" and "Recording take" templates in
  the list. Avoid those views (start on the finished program, search to a filtered result). Never
  rename test items into invented content.

## Access and content

- Local portal sign-in uses the dev one-time code (`246810` in the demo stack). Code sends are
  throttled to **5 per hour per link** — plan the sign-in takes.
- Only **live** catalog items launch a real vendor player; synthetic catalog rows do not. The
  Percipio test catalog had one live field-safety course; two short live conflict courses filled
  the three-course program. Check the catalog before writing the script.
- The cast is fictional (Tallgrass Constructors: Caleb, Luis, Owen, Dana …), personal emails use a
  reserved test domain. Real customer names, sites or exports never appear, even as inspiration
  for fixture names.
