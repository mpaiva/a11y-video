# Demo data — fixture rules and traps

The video can only show what the database really holds, so the story is built in the data first.
Every trap below put a contradiction on screen in a Tallgrass draft (the worked example: a learning
feature in an HR product). The product specifics are that app's; the rule each one teaches is general.

## Isolation

- Run the demo stack against an **isolated** database (the Tallgrass demo used its own Docker
  Compose project and Postgres port) — never the shared dev database, never staging or production.
- Make **one database copy per story state** and leave the originals untouched. Tallgrass used
  `film_v6_before` (Caleb at 1 of 3, second course assigned and due Oct 4) and `film_v6_after`
  (2 of 3, caught up, more training Oct 4). Name copies `<prefix>_<version>_<state>`.
- Run any new migrations on the copies only. If a new table lacks the app role's grants, apply
  the normal local grants to that table only — never disable row-level security or append-only
  protections.
- **Before every take, prove the port → database mapping** (the database name each running process
  is configured with). A take recorded against the wrong copy shows the wrong state.
- Record a manifest: what was seeded, which completions were replayed, which copy each take used.

## Product rules decide what is visible

Most apps gate what a person sees on earlier state (access, roles, a finished step). Find those
rules in the code at gate 1 and seed the demo people **through the real product paths**, so the
screen shows what a real customer would get. A seed script that creates the state directly is demo
setup, not a product path — never narrate it as one.

Example (Tallgrass): a training rule assigned only people who already had portal access, and only
onboarding created it, so people who never onboarded were skipped ("No portal access yet"). The
demo people went through onboarding first. The rule also had no exclude operator, so one condition
could replace a job-title exclusion list only where the data marked the group in a field.

## Completions

- Completions **carry forward** into a new program: a person who finished a course elsewhere shows
  it complete in the new one. The course completed on camera must be one the person has not done.
- Do not invent third-party results (a vendor's completion, payment or sync). Tallgrass replayed
  previously verified vendor completion facts against rebuilt history using the application's own
  code paths, and said so in the provenance notes.
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
- **Test clutter:** test courses in the catalog grid, "Demo" and "Recording take" templates in
  the list. Avoid those views (start on the finished program, search to a filtered result). Never
  rename test items into invented content.

## Access and content

- Find the app's local sign-in shortcuts (a dev one-time code, a test login) and its rate limits
  before planning sign-in takes. In Tallgrass, code sends were throttled to 5 per hour per link.
- Only **real** third-party content runs end to end; synthetic rows that stand in for it usually do
  not. Tallgrass's vendor test catalog had one live field-safety course; two short live courses
  filled the three-course program. Check what is really live before writing the script.
- The cast is fictional (for example Tallgrass Constructors: Caleb, Luis, Owen, Dana …), personal
  emails use a reserved test domain (`example.com`, `.test`). Real customer names, sites or exports never appear, even as inspiration
  for fixture names.
