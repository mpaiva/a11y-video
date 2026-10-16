# Narration — how the voice should sound

These rules come from the product owner's notes on the Tallgrass demo drafts (the worked example: a
learning feature in an HR product, fictional cast). Every "before" line below was actually written
and rejected; every "after" line is what shipped. Read the pairs — they teach faster than the rules.

## The narrator

**A presenter demoing live, in the first person, calm and natural — "like I would do it".**
The narrator is the admin side of the demo talking to one viewer who does that job.

| Before (rejected) | Why | After |
|---|---|---|
| "Dana begins in Templates and creates a training template." | Third person about a persona sounds robotic. | "Okay, switching over to the admin side. I'm making a new training program…" |
| "So I'm on his phone… I'll launch it… pass the test…" | The presenter is not the worker. Never act as the employee. | "Here's what he sees on his phone. He puts in his personal email… gets a code… and he's in." |
| "Caleb has no work email. He finished his safety training on his phone. No site visit, no paper sign-off sheet." | Dramatic, hype, "no X, no Y" contrasts. | "Caleb has no work email. He signs in with his personal email and a one-time code, and completes his training." |
| "Now watch this — if I type a start date in here…" | Showy. | "If I type a start date here… you can see exactly when each one opens." |
| "Thanks for watching." | Reads like a promo sign-off. | End on the last real line: "So I set it up once… and every new field hire gets it on their own schedule." |

## Empathy without drama

Empathy comes from naming the viewer's real moment in one clause, taken from the customer
evidence — never from adjectives, never from invented stakes.

| Before | Why | After |
|---|---|---|
| "I know a lot of you keep a grouping for every start date, plus a list of job titles to leave out." | A prevalence claim ("a lot of you") with one customer as evidence, and wrong in detail (the legacy tool groups per release step, not per start date). | "If you've ever built a separate grouping for each step of a new-hire series… or left out job titles one at a time — here it's one rule." |
| "Until now, every new start date meant another grouping to build by hand." | Asserts the viewer's past. | Use a conditional ("If you've ever…") so it is true for whoever is watching. |

## Say only what the screen proves

- **Only behaviour that ran in the app.** Not "we'll email him" unless an email was delivered; not
  "four people match" unless the count is visible at that moment (draft 1 dropped the line when the
  rule drawer hid the count; it came back when a re-capture showed it).
- **No table stakes.** "Complete, confirmed by the vendor" was cut: customers assume completion
  sync works; highlighting it spends time on nothing new.
- **Match the screen.** "And now he's at two of three" over an almost-empty "You're caught up"
  page confused a reviewer. Fix: "And now he's done two of three. He's caught up… the last one
  opens October fourth." plus a slow push-in on the caught-up line.
- **Story order.** Do not show a later state before the story reaches it: the assignment list
  showed Caleb at "2 of 3" before he finished his second course — the shot was reframed to names
  and start dates only.
- **Exact product terms.** The release schedule counts from the employment **start date**; the UI
  label said "Hire date". Hire date ≠ start date. The narration says "start date" and the label is
  a bug to report (it was fixed in the demo build with a local patch).
- **No questions to the viewer and no closing questions.** Questions belong in the live call.
- **No end card.** End on the worker's real final state, hold about a second, fade out.

## Kokoro voice

Default voice `af_heart` (American English, the top-graded voice on the Kokoro-82M model card),
speed 1. `tools/demo-video/voice.py` runs Kokoro on this machine: there is no key, and the script
never leaves the machine.

Kokoro has no tone directions. The voice you pick sets the tone for the whole film, so **the
requester picks the voice by ear at gate 2**, before any takes are made. Make the first script line
in `af_heart`, `af_bella` and `af_sarah`: copy the lines file once per voice with only `voice`
changed, and run `uv run --locked tools/demo-video/voice.py <copy> --project <demo>/voice-audition/<voice>
<first-line-id>`. Send the three files; record the pick in `BRIEF.md` and set it as `voice` in the
lines file. A `b` prefix is British English (`bf_emma`). Do not offer `af_nicole`: it whispers.

- **No style tags.** Kokoro reads `[calm]` aloud as a word, so `voice.py` refuses a line with a
  tag. The delivery comes from the words and the punctuation: write the line the way a calm
  presenter says it. No exclamation marks — they read as hype.
- **Pauses come from punctuation.** Measured on the "Day zero, day seven, day fourteen…" line: a
  comma gives a pause of about 0.2 s; an ellipsis, a dash or a full stop gives about 0.4 s. Use
  commas between list items and an ellipsis for the beat before a reveal.
- **Pronunciation.** When Kokoro says a product or person name wrong, write an inline override
  with its phonemes, for example `[Percipio](/pɚsˈɪpiˌO/)`. It is the one bracket form `voice.py` accepts. Listen for names in
  the first take.
- **Pace.** `speed` in the lines file sets the pace of every line (0.9 made the "Day zero…" line about 6% longer). Keep
  one speed for the film. A take that does not fit its shot means you re-time the shot; never speed
  up one line to fit.
- **One take per line.** Repeat takes come out almost identical (same length, pitch variation
  within 0.03 semitones), so `takes` defaults to 1. To change how a line sounds, change its words or
  punctuation and run `voice.py` again: it replaces that line's takes. Still run
  `pick-takes.py --write-edl`, because it is how a take reaches the EDL.
- **Trimming a word off a take:** give the EDL voice line a `cut` that ends at the silence before
  the word.
- **Loudness:** normalize every line to about −20 LUFS with the clip's volume (the builder does
  this); a quiet room-tone bed (about −52 dBFS) under the whole film avoids digital-silence gaps.

## The worked script (Tallgrass, draft 5)

1. "So this is Caleb. He's a pipefitter, and he doesn't have a work email… so he signs in with his
   personal email and a code."
2. "He started on September twentieth. He's already done the first course, and the second one's
   due October fourth."
3. "Okay, here's how I set that up. It's one program, with three Skillsoft courses." → "I turn on
   the release schedule, and it counts from each person's start date." → "Day zero, day seven, day
   fourteen… and seven days to finish each one."
4. "Then, who gets it. If you've been building a separate grouping for every release… here it's
   one rule." → "Field Operations, started on or after September first." → "Four people
   match." → "All four get it… and new field hires get picked up after onboarding."
5. "If I put in Caleb's start date, September twentieth… those are his dates. Due the
   twenty-seventh, due October fourth, and the last one opens October fourth."
6. "He opens it in Skillsoft." → "And now he's done two of three. He's caught up… the last one
   opens October fourth."
7. "And in the overview, Luis is in the same program, and he's behind on all three. It shows how
   late he is, and which rule assigned them." → "And this is the 'Nothing will chase them' list.
   Owen has a course with no due date, so nothing's going to follow up on it."
8. "So I set it up once… and every new field hire gets it on their own schedule."

The full line set is `tools/demo-video/examples/tallgrass-field-training/voice-lines.json`. The
Tallgrass cut was voiced with ElevenLabs before this skill moved to Kokoro, so the worked-example
EDL names the original takes. Run `voice.py` and then `pick-takes.py --write-edl` on the line file:
every line then gets a Kokoro take `<line-id>-1`. Six lines already name `-1`, so `pick-takes.py`
reports them unchanged although their audio is new. The original outro take also said "Thanks
for watching", so the example EDL cuts it at 5.6 s. Remove that cut after you regenerate the
takes: a Kokoro take ends at "…on their own schedule."
