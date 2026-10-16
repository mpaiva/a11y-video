# Intake interview — gate 0

The demo is only as good as what goes into it. On the Tallgrass demo the most expensive rework
came from things nobody asked up front: who the viewer really was (the first draft was aimed at
the wrong person), what the customer actually said (an empathy line claimed "a lot of you" on one
customer's evidence), which features were really built (an "email the link" beat had no product
path), and the format (a closing question card, then "Thanks for watching", were both removed late).

## How to run it

- **One round, at most 8 questions.** Skip any question the request already answers; never ask
  what you can read.
- **Ask for files, not descriptions:** transcript paths, PR numbers, plan paths, recordings.
- **Ask well:** in Claude Code use AskUserQuestion with concrete options plus "Other"; in Codex ask
  a plain numbered list.
- **Read every artifact the requester provides before writing the brief:** transcripts end to
  end, PR bodies and diffs, plan ACs, the JTBD rows, the claim register.
- **Missing artifacts never block.** Not everyone has a transcript or a persona. Write "none
  provided" in the brief, work from the answers and the defaults, and keep claims modest: without
  customer evidence there is no empathy line about "your" workflow and no prevalence claim.
- **Write `BRIEF.md`** from `templates/brief.md`: every answer, every default applied, the
  artifacts read (path + one line on what it gave, or "none provided"), and the open questions.
  From here on, gates cite the brief.

## The eight questions and what each feeds

| # | Question | Feeds |
|---|----------|-------|
| 1 | **Feature** — PRs, Jira key, plan path | Gate 1 (capability check, claim register) |
| 2 | **Viewer and goal** — who, and feedback or interest? Live call or async? | Tone, length, closing |
| 3 | **Customer evidence** — transcripts, recordings, notes, exports | The viewer's real moment, the empathy line, the problem framing |
| 4 | **Personas and cast** — on-screen cast, demo org; which persona agent reviews | Fixture, gate 8 |
| 5 | **Workflow** — JTBD IDs from `docs/product/jtbd/` (`/jtbd` LOOKUP), `agents/evidence/` loops, or the requester's words | The "before"; which beats to show |
| 6 | **Must show / must not show** | Script, capability check |
| 7 | **Environment and data** — stack, database, reusable recordings, who captures | Gates 3–4 |
| 8 | **Format** — length, phone/desktop, voice, deliverables | Gates 6–7, 10 |

Defaults when an answer is missing: calm first-person presenter, about 2 minutes, 1920x1080 at
30 fps, Kokoro voice `af_heart`, no end card, narrated + silent. The brief names each default
used.

## Worked example — the Tallgrass field-training demo (de-identified)

What the intake would have produced on day one, had it existed. The customer is described by role
only; their call transcript stayed a local file and nothing from it is quoted here.

1. **Feature:** Learning — training templates with a release schedule counted from each person's
   start date, assignment rules, the employee portal with personal-email sign-in, and the Learning
   overview. Evidence: the merged learning PRs on `main` at the demo commit; later the portal UI
   refresh (PR #784) and the course landing page (PR #822) forced a re-capture.
2. **Viewer and goal:** first viewer is an L&D and performance lead at a construction firm (the
   reference customer); the same video then goes to similar field-heavy customers. Goal: product
   feedback and some interest. Async video, then discussed on a recurring design-partner call.
   *Correction this would have caught:* the first narrative was aimed at a designer from an
   internal prototype walkthrough, not the customer.
3. **Customer evidence:** one design-partner call transcript (local, not committed) and two legacy
   exports (assignments and audience groupings). What it gave, paraphrased:
   - field crews have no work email and cannot get through single sign-on; the team travels to job
     sites and collects paper sign-off sheets;
   - new-hire training is released by building one grouping and one assignment per release step;
     a six-month series is coming and dreaded;
   - craft workers are kept out of professional-only training by excluding job titles one at a time;
   - weekly reminders, then the manager is copied on overdue notices, then HR leadership chases;
   - most of the learning system is used for compliance; vendor modules sometimes fail on phones.
   *Check it enforces:* "a lot of you keep a grouping for every start date" was not supported (one
   customer, and the legacy tool groups per release step) — the line became a conditional.
4. **Personas and cast:** fictional org Tallgrass Constructors (16 people); worker Caleb, a
   pipefitter with a personal email; Luis (overdue), Owen (no due date); the presenter speaks as the
   admin. Persona review: `dana`, the fictional L&D lead (PR #722, not merged at the time — it ran
   from its PR worktree).
5. **Workflow:** the customer's grouping-per-release and job-title-exclusion workarounds, and the
   site-visit sign-off loop (from the call); no JTBD row covered field training at the time.
6. **Must show:** personal-email sign-in on a phone; a three-course program released on days 0, 7
   and 14 from the start date; one assignment rule; the worker's progress; overdue and no-deadline
   lists. **Must not show:** sending the portal link (no admin action existed for training-only
   people), email delivery (never demonstrated), overdue or manager emails, rule exclusions,
   in-person completion, yearly retraining, iPhone (WebKit failed on the http stack), real names.
7. **Environment:** an isolated demo stack and Postgres (its own compose project); Codex owned the
   stack, the database copies and the capture; genuine Percipio playback from an earlier session
   reused.
8. **Format:** about 2 minutes, 1920x1080, 30 fps, voiced with ElevenLabs at the time (today the default is Kokoro `af_heart`), calm first person, no end
   card, narrated + silent.

Open questions that should have been in the first brief: whether the UI's "Hire date" label (the
code counts from the start date) gets fixed before recording; whether completion timestamps may
appear on screen.
