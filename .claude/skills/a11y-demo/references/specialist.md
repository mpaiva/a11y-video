# The specialist's narration

The narrator is an accessibility specialist testing the page live, in the first person, calm and
plain: "like I would do it". demo-video's `references/narration.md` holds for every line (first
person, no hype, no "no X, no Y" contrasts, say only what the screen proves, no questions to the
viewer, no end card). This file adds how a tester thinks, so the narration teaches the method and not
just the result.

## The testing sequence

A specialist tests in this order, each step with its own goal. The film's introduction states the goal of
the test, names the six steps in a sentence, and says which of them the film shows. Never imply that a
step not on camera was done: "steps one and two come before the screen reader" is true of the method;
"I've already checked the keyboard" is a claim that needs its own evidence.

1. **Inspect the page structure before using the screen reader.** Review the DOM, the accessibility tree,
   automated scan results and the visible UI. Identify headings, landmarks, forms, interactive controls
   and dynamic content. *Goal: understand the intended structure and find obvious semantic problems.*
2. **Test keyboard-only navigation.** Tab, Shift+Tab, Enter, Space, Escape and arrow keys where they apply.
   Check focus order, focus visibility, keyboard traps and expected interaction behaviour. *Goal: the
   interface is operable without a mouse before screen-reader behaviour comes in.*
3. **A linear screen-reader reading pass.** From the top of the page, with the reading commands (VO-Right).
   Check the page title, language, content order, meaningful announcements, hidden content, and whether
   the page makes sense without visual context. *Goal: the experience of discovering and understanding
   the page.*
4. **Structural navigation.** Jump by headings, landmarks, links, buttons, form fields and tables, with
   quick-navigation commands and the rotor. Check heading hierarchy, landmark names, link purpose,
   control labels and table relationships. *Goal: a screen-reader user can find information without
   reading the whole page.*
5. **Controls and interactive components.** Menus, tabs, accordions, dialogs, comboboxes, date pickers.
   Check accessible name, role, state, value, keyboard behaviour, focus management and announcements.
   *Goal: controls are understandable and usable, not merely discoverable.*
6. **Real user tasks.** Whole workflows: search, filter, complete a form, submit, correct errors, save,
   move between pages. Check validation messages, status updates, loading states and focus after
   navigation or dynamic changes. *Goal: users can complete the intended outcome.*

Steps 1 and 2 happen without VoiceOver and mostly off camera; the film picks up at step 3 or later. Map
the scene steps to it: a VO-Right read-through is step 3, `heading`, `landmark` and `link` are step 4,
`focus`, `activate` and `escape` on one control are step 5, a scene that fills and submits a form is
step 6.

## How a tester listens

A specialist doesn't read the screen; they listen for what a screen-reader user would get, and narrate
the gap between what they hear and what the page means. Narrate those moments:

- **Orientation.** Where am I? The page title, then whether there is a skip link and landmarks.
  "The first thing it reaches is a skip link, which is a good start."
- **Structure.** Do the headings outline the page? Are the regions named? "Six landmarks, each with
  a name: I can jump to the main content in one key."
- **Names, roles, states.** Every control should say what it is, what kind of thing it is, and what
  state it's in. "A button, and it tells me it's collapsed. That's what I want to hear."
- **Order.** Does Tab follow the reading order? Does the read-through make sense from top to bottom?
- **The surprise.** The thing that sounds wrong: silence where something is on screen, a word for
  something that isn't, a title read twice. Say exactly what VoiceOver said, then why it matters to a
  listener, in one sentence, from their side: "If you're listening, it sounds like the page has
  stopped."

Say what you are about to do before VoiceOver does it ("Now I'll read the header one item at a time"),
so the viewer knows what to listen for. Keep VoiceOver's own words for VoiceOver: the narrator never
repeats a long phrase the caption bar already shows; it names the part that matters.

## A series, one step per video

When the brief wants the whole method, make a series instead of one long film: an **overview** (about a
minute: the goal of the test, the six steps in a sentence each, what the series covers, the page and
builds), then **one short video per step** (1–2 minutes), then the **fix and re-test** if there is one.
Each opens by naming its step and what that step is for, so it works on its own, and ends on its last
real moment. Keep the narrator, the layout and the builds the same across the series. Plan it in a
`SERIES.md` in the demo folder: per video, what's on screen, what it shows, and what tooling it needs.
Steps 1 and 2 are not VoiceOver scenes (the Web Inspector, the keyboard on its own), so they need
captures of their own; say so in the plan rather than faking them with VoiceOver.

## Stories that work

- **Find, explain, fix, re-test** (the worked example): one take on the build with the problem, the fix
  in one sentence, the same steps on the fixed build. The re-test is the proof; it uses the same
  commands, so the difference is the page and nothing else.
- **A structured pass:** orientation, structure, names and states, order, with commentary on what
  passes and what doesn't. Works on any page; keep it to the moments worth hearing.
- **One control, closely:** a disclosure, a dialog, a form field, heard opening, being used and closing.

## Saying the finding

- Name the component and the behaviour, never a person: "The settings panel is closed, but the four
  dropdowns inside it are still reaching VoiceOver."
- Say "VoiceOver in Safari" when the behaviour may be the browser's: a stall like the worked example's
  is a WebKit quirk, and the page is fixed to avoid it. Don't claim every screen reader does it.
- **Naming WCAG**, when the brief asks for it (the worked example does): name a criterion only where the
  take is the evidence, at the moment it is heard, once. Positive moments count too: a skip link is
  2.4.1 Bypass Blocks, a control that says its name, role and state is 4.1.2.
  - Say "a problem under four point one point two", not "fails", unless the brief is an audit: one take
    on one page is not a conformance claim, and the cause may be the browser. "Holds here", not
    "passes", for the re-test.
  - One criterion per finding. Two in a breath ("four point one point two and one point three point
    two") can't be followed by ear; the second goes in the brief.
  - Write the number as words ("four point one point two"), and "WCAG" with Kokoro's override,
    `[WCAG](/wˈʌkæɡ/)`, so it is said "wuh-cag". Check both with a transcript of the take: it should
    come back as "WCAG 4.1.2".

## Reviewing the cut (added to demo-video's review checklist)

- Every narrator line that quotes or describes VoiceOver matches the phrase log of the take it's in.
- The caption bar matches VoiceOver's audio, phrase for phrase, and is on screen while it speaks.
- No VoiceOver phrase is cut short by a scene end or covered by the narrator.
- The silence that is part of a finding is still there, at its real length.
- The re-test uses the same commands as the test, on the fixed build.
- Captions for both voices, three ways: in the bar (VOICEOVER and NARRATOR), as a track inside the MP4,
  and in the `.vtt`. No cue longer than two lines of the bar; each narrator cue within about a second of
  its words (compare with the transcript `qa.sh` writes).
- The transcript matches the script word for word.
