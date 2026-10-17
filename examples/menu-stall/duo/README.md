# Testing the home page with VoiceOver, told by two voices

A first pass at testing this site’s home page with VoiceOver, the screen reader built into the Mac, before testing it with people with disabilities. The goal was to find barriers early and fix them. Each step is a short video; each problem found is fixed and tested again in the same video.

Each still opens its video. To watch them in the page, with captions you can turn on and off, download this folder and open [index.html](index.html) in a browser.

## The brief

The home page works with a keyboard and a screen reader for most of what was tested. It has a skip link, a clear outline of headings, named regions, and controls that say what they are and what state they are in. Focus is always visible, and Escape always puts it back where you were.

The test found six problems on the page. Five are fixed and live, one of them by working around a bug in Safari, and one, a small one, is still open. One more thing heard was VoiceOver and Safari, not the page.

- **Fixed: A hidden menu held VoiceOver for four presses.** Just after the Set for you button, VoiceOver said “menu” four times and didn’t move. There was no menu on screen: the closed settings panel still held its four dropdowns, and Safari passed them to VoiceOver. Someone listening would think the page had stopped.<br>Fixed: the panel is now left empty while it is closed. Live since October 16, 2026.<br>WCAG 4.1.2 Name, Role, Value · [Watch it](#reading-pass)
- **Fixed: Changing a setting wasn’t announced.** Turning the drawings off worked, but nothing said so. The note confirming it was only on screen, so someone listening had to go and look for it.<br>Fixed: a status line now says what each change did. VoiceOver says “Drawings are off and their captions go with them.” Live since October 17, 2026.<br>WCAG 4.1.3 Status Messages · [Watch it](#task)
- **Fixed: Describe this page read only its name when it opened.** When the dialog opened, VoiceOver read its name and heading, but not the description under them, the picture of the page, until you went looking. (An earlier draft of this report said the dialog opened in silence; that came from the test runner, not the page.)<br>Fixed: the heading now carries the description, so VoiceOver reads it the moment the dialog opens. Re-tested on mpaiva.com. Live since October 17, 2026.<br>Not a WCAG failure on its own; it stops the feature doing its job · [Watch it](#describe)
- **Fixed: Essay links in the drawing strip read their title twice.** In the band of drawings, each link read its essay’s title twice, then the whole summary. The links made sense, but a list of them was slow to get through.<br>Fixed: each link now says its title once, then the summary. Live since October 16, 2026.<br>WCAG 2.4.4 Link Purpose is met; a listening cost · [Watch it](#structure)
- **Open: The strip’s preview is read again after its links.** Reading the page item by item, the preview card for the drawing in the middle of the strip is read after the strip’s links, so one essay’s title and summary are heard a third time.<br>Open: hiding the preview from screen readers would stop it, while its summary still reaches the link. Not done yet.<br>No WCAG failure; a listening cost
- **Fixed: Old focus rings stayed on screen as VoiceOver moved.** As VoiceOver jumped from link to link, Safari left focus rings behind on links it had already passed, and kept the skip links showing after focus left them. Someone watching couldn’t tell which link had focus. The page’s styles were right: this is a bug in Safari, and a real Tab press doesn’t show it.<br>Fixed: a small script now makes Safari redraw whatever just lost focus. Tested with VoiceOver over the same ten links: ten rings before, one after. Live since October 17, 2026.<br>WCAG 2.4.7 Focus Visible · [Watch it](#structure)
- **Not the page: Choosing from a dropdown reads the old value first.** When you pick a new value in a dropdown, VoiceOver first reads the value it had before. This happens with Safari’s standard dropdown, not because of the page; the status line now follows it with the right answer.<br>VoiceOver in Safari · [Watch it](#task)

> **Two voices.** The tester (af_heart) drives VoiceOver and the keyboard and says what she hears. The reviewer (am_puck) names the guideline a problem falls under, explains why it matters, and says what changed in the code. Both are synthetic voices; the captions label them Tester and Reviewer.
>
> **What these videos are.** VoiceOver in Safari, on macOS 27, driven by a script so each test can be run again the same way. What you hear from VoiceOver is what it said. The narrator is a synthetic voice, describing what a tester listens for.
>
> **What they are not.** An audit, or a claim that the site conforms to WCAG. It is one specialist, one screen reader and one browser, on one page. Nobody who uses a screen reader every day took part: that comes next, in the recommendations.
>
> **Captions.** Every video has captions for both voices on screen. They are also in each video as a captions track, and as a file you can download, with a transcript under each video.

## How it was tested

1. **Inspect the page structure before using the screen reader.** Goal: understand the intended structure and find obvious semantic problems. [Video](#structure-code)
2. **Test keyboard-only navigation.** Goal: the page works without a mouse, before the screen reader comes in. [Video](#keyboard)
3. **A linear reading pass with the screen reader.** Goal: the experience of discovering and understanding the page. [Video](#reading-pass)
4. **Structural navigation: headings, landmarks, links.** Goal: finding information without reading the whole page. [Video](#structure)
5. **Controls and interactive components.** Goal: controls are understandable and usable, not merely discoverable. [Video](#control)
6. **Real user tasks, start to finish.** Goal: people can complete what they came to do. [Video](#task)

## The videos

<a id="overview"></a>

### Overview

[![Still from the video: Overview. Opens the video, 1:20.](v0.jpg)](v0.mp4)

[Watch the video](v0.mp4) (1:20, captions on screen and as a track) · [captions file](v0.vtt) · [transcript as text](v0.transcript.txt)

The tester and the reviewer introduce themselves and how they split the work, then the goal of the test, why it is a first pass, the six steps, and how each video goes: find, fix, test again.

<details>
<summary>Transcript</summary>

- 0:00 **Tester:** Hello. This is the home page of Marcelo Paiva's site, in Safari, with VoiceOver on. I'm the tester. I'll drive VoiceOver and the keyboard, and tell you what I hear.
- 0:11 **Reviewer:** And I'm the reviewer. When something sounds wrong, I'll name the guideline it falls under, and explain why it matters to the person it stops. When it's fixed, I'll say what changed in the code.
- 0:24 **VoiceOver:** Marcelo Paiva — Design Engineer web content is in the VoiceOver cursor
- 0:28 **Tester:** The goal is simple. Can someone using VoiceOver understand this page, find what they need, and use its controls, without seeing it?
- 0:37 **Reviewer:** This is a first pass, before testing with people with disabilities. It finds problems early, so they can be fixed, and so the time with people goes on what only they can tell us.
- 0:48 **Tester:** I test in six steps. First, I inspect the page structure in the code. Second, the keyboard on its own. Third, a reading pass with the screen reader, top to bottom. Fourth, jumping by headings, landmarks and links. Fifth, the controls themselves. And sixth, real tasks, start to finish.
- 1:07 **Reviewer:** Each step gets its own short video. When we find a problem, we fix it, and test again in the same video. At the end, we list what still needs testing with people.

</details>

<a id="structure-code"></a>

### Step 1: the structure, before the screen reader

[![Still from the video: Step 1: the structure, before the screen reader. Opens the video, 1:15.](v1.jpg)](v1.mp4)

[Watch the video](v1.mp4) (1:15, captions on screen and as a track) · [captions file](v1.vtt) · [transcript as text](v1.transcript.txt)

Safari’s Web Inspector, before any screen reader: what the page tells assistive technology. The Set for you button says it is collapsed and which panel it controls. That panel is hidden, but its four dropdowns are still inside it, in the page.

**Finding.** Something to listen for, not yet a problem: hidden content should stay out of a screen reader’s way. The reading pass in step 3 hears that it doesn’t.

<details>
<summary>Transcript</summary>

- 0:00 **Tester:** Step one, before any screen reader: the structure in the code. I'm opening Safari's Web Inspector, and making it larger, to see what this page tells assistive technology.
- 0:12 **Keyboard:** Command-Option-I: the Web Inspector
- 0:15 **Keyboard:** Command-Plus: makes the Inspector larger
- 0:17 **Keyboard:** Command-Plus: larger again
- 0:19 **Keyboard:** Command-Option-C: the Console
- 0:21 **Keyboard:** Command-K: clears the Console
- 0:24 **Keyboard:** Typed inspect(document.querySelector('button\[aria-expanded\]'))
- 0:27 **Tester:** This is the Set for you button. Its attributes say aria-expanded, false, and aria-controls points at the panel it opens.
- 0:36 **Reviewer:** That's what a screen reader needs. Expanded, false, is announced as collapsed, so the person knows there's more behind it.
- 0:44 **Keyboard:** Command-Option-C: back to the Console
- 0:46 **Keyboard:** Command-K: clears the Console
- 0:48 **Keyboard:** Typed panel = document.getElementById(document.querySelector('button\[aria-expanded\]').getAttribute('aria-controls'))
- 0:51 **Keyboard:** Typed \[panel.hidden, panel.querySelectorAll('select').length\]
- 0:54 **Tester:** That panel is marked hidden, and the four dropdowns are still inside it, in the page.
- 1:00 **Reviewer:** Hidden content should stay out of a screen reader's way. Nothing's wrong yet… but it's the first thing to listen for, in the reading pass.
- 1:09 **Keyboard:** Command-0: the Inspector back to normal size
- 1:11 **Keyboard:** Command-Option-I: closes the Web Inspector

</details>

<a id="keyboard"></a>

### Step 2: the keyboard on its own

[![Still from the video: Step 2: the keyboard on its own. Opens the video, 1:56.](v2.jpg)](v2.mp4)

[Watch the video](v2.mp4) (1:56, captions on screen and as a track) · [captions file](v2.vtt) · [transcript as text](v2.transcript.txt)

No screen reader and no mouse: real key presses, with the focus ring showing where each one lands. The skip link skips the header, and Shift-Tab retraces it in screen order. Set for you opens with Return; typing “n” in the Drawings dropdown chooses “not at all”, and the drawings go. Escape puts focus back on the button, and Space presses Pause motion.

**Finding.** For everything tested here, the page works without a mouse. WCAG 2.1.1 Keyboard and 2.4.7 Focus Visible hold.

<details>
<summary>Transcript</summary>

- 0:00 **Tester:** Step two, the keyboard on its own. No screen reader and no mouse, just the keys a keyboard user presses, and the focus ring that shows where I am.
- 0:10 **Keyboard:** Tab → link, Skip to content
- 0:12 **Tester:** The first stop is a skip link. I'll press Return, then Tab, to see whether it really skips the header.
- 0:19 **Keyboard:** Return → main
- 0:21 **Keyboard:** Tab → link, Read the writing
- 0:23 **Tester:** I'm on Read the writing, past the whole header. The skip link works.
- 0:27 **Reviewer:** That's WCAG 2.4.1, Bypass Blocks. Without it, a keyboard user tabs through every link in the header, on every page.
- 0:37 **Tester:** Now back up, with Shift-Tab.
- 0:40 **Keyboard:** Shift-Tab → button, Pause motion
- 0:42 **Keyboard:** Shift-Tab → button, Set for you, collapsed
- 0:43 **Tester:** Pause motion, then Set for you: the same order as on screen, and the focus ring follows every time.
- 0:51 **Reviewer:** That's 2.4.7, Focus Visible. If you can't see where focus is, using a keyboard is guesswork.
- 0:58 **Tester:** I'll open it with Return.
- 1:01 **Keyboard:** Return → button, Set for you, expanded
- 1:03 **Keyboard:** Tab → pop-up button, Drawings, in calm color
- 1:05 **Tester:** It opens, and Tab takes me to the first setting, the drawings. With a dropdown focused, I can type the first letter of a choice. N, for not at all.
- 1:15 **Keyboard:** Typed n
- 1:17 **Keyboard:** Focus is on → pop-up button, Drawings, not at all
- 1:18 **Tester:** The dropdown says not at all, and the drawings are gone. Now Escape.
- 1:23 **Keyboard:** Escape → button, Set for you, collapsed
- 1:25 **Tester:** Escape closes the panel, and puts focus back on the button. Next, Pause motion.
- 1:31 **Keyboard:** Tab → button, Pause motion
- 1:33 **Keyboard:** Space → button, Pause motion, pressed
- 1:34 **Tester:** Space presses it, and the button now says pressed.
- 1:38 **Reviewer:** Tab, Shift-Tab, Return, Escape, Space, and typing to choose. Every control works without a mouse, and focus is never trapped or lost. For what was tested, the goal of step two is met. WCAG 2.1.1, Keyboard, holds here.

</details>

<a id="reading-pass"></a>

### Step 3: the reading pass, then the fix

[![Still from the video: Step 3: the reading pass, then the fix. Opens the video, 2:21.](v3.jpg)](v3.mp4)

[Watch the video](v3.mp4) (2:21, captions on screen and as a track) · [captions file](v3.vtt) · [transcript as text](v3.transcript.txt)

VoiceOver reads the home page from the top, one item at a time. Just after the Set for you button it says “menu”, four times, and doesn’t move. There is no menu on screen. Then the same steps on the fixed page.

**Finding.** A problem under WCAG 4.1.2 Name, Role, Value, fixed: the panel is now empty while it is closed, and VoiceOver goes from Set for you straight to the next button. WCAG 4.1.2 holds.

<details>
<summary>Transcript</summary>

- 0:00 **Tester:** Step three, the reading pass. The home page from the top, in Safari with VoiceOver, the way someone who can't see the screen would meet it.
- 0:13 **VoiceOver:** Skip to content visited link is in the VoiceOver cursor
- 0:16 **Tester:** The first thing it reaches is a skip link, which is a good start. Now I'll read the header one item at a time.
- 0:23 **VoiceOver:** Describe this page dialog pop up button
- 0:26 **VoiceOver:** banner
- 0:28 **VoiceOver:** visited link Marcelo Paiva
- 0:31 **VoiceOver:** Main navigation
- 0:33 **VoiceOver:** list 5 items
- 0:35 **VoiceOver:** link Writing 1 of 5
- 0:37 **VoiceOver:** link Work 2 of 5
- 0:39 **VoiceOver:** link Signal 3 of 5
- 0:42 **VoiceOver:** link Tools 4 of 5
- 0:44 **VoiceOver:** link Resume 5 of 5
- 0:46 **VoiceOver:** end of list
- 0:48 **VoiceOver:** end of Main navigation
- 0:50 **VoiceOver:** Set for you collapsed button
- 0:53 **Tester:** Set for you… a button, and it tells me it's collapsed. That's what I want to hear. Next item.
- 0:58 **Reviewer:** A name, a role, and a state. That's what WCAG 4.1.2 asks for.
- 1:05 **VoiceOver:** menu
- 1:07 **VoiceOver:** menu
- 1:12 **VoiceOver:** menu
- 1:14 **VoiceOver:** menu
- 1:19 **Tester:** It says menu… and again… and again. Four presses, and it hasn't moved past it.
- 1:24 **Reviewer:** There's no menu on screen. The settings panel is closed, but its four dropdowns are still reaching VoiceOver. That's a problem under WCAG 4.1.2, Name, Role, Value. If you're listening, it sounds like the page has stopped, right at the control that sets the site up for you.
- 1:44 **Reviewer:** The fix: the panel is now left empty while it's closed. Here's the same page after that change.
- 1:51 **Tester:** I'll go straight to Set for you.
- 1:53 **VoiceOver:** Set for you collapsed button
- 2:01 **Tester:** Collapsed, the same as before. Next item.
- 2:05 **VoiceOver:** Pause motion toggle button
- 2:11 **Tester:** That's Pause motion, the next button on the screen. The silence is gone.
- 2:16 **Reviewer:** 4.1.2 holds here.

</details>

<a id="structure"></a>

### Step 4: structural navigation, then the fix

[![Still from the video: Step 4: structural navigation, then the fix. Opens the video, 3:43.](v4.jpg)](v4.mp4)

[Watch the video](v4.mp4) (3:43, captions on screen and as a track) · [captions file](v4.vtt) · [transcript as text](v4.transcript.txt)

Jumping by headings, landmarks and links instead of reading everything. The heading outline holds and every landmark has a name. In the drawing strip, each link reads its essay’s title twice, then the whole summary, and Safari leaves focus rings behind on links already passed. Then the same links on the fixed page.

**Finding.** Headings: WCAG 1.3.1 holds. Links: WCAG 2.4.4 is met, but the doubled titles made the list slow to get through. Focus: stale rings fail WCAG 2.4.7 on screen; the cause is a Safari bug. Fixed: each link now says its title once, then its summary, and only the current link has a ring.

<details>
<summary>Transcript</summary>

- 0:00 **Tester:** Step four, structural navigation. Someone using a screen reader rarely reads every item. They jump, by headings, by landmarks, and by links. First, headings.
- 0:12 **VoiceOver:** heading level 1 I design experiences and ship accessible code that runs them.
- 0:16 **VoiceOver:** heading level 2 LATEST WRITING
- 0:19 **VoiceOver:** Last heading heading level 2 LATEST WRITING
- 0:22 **VoiceOver:** heading level 3 link Designers don't need Figma anymore
- 0:25 **Tester:** One level one, a level two for the latest writing, and the essays under it at level three. The outline holds, all the way down.
- 0:34 **Reviewer:** That's WCAG 1.3.1, Info and Relationships. Headings are how someone using a screen reader skims a page.
- 0:46 **Tester:** Now landmarks.
- 0:49 **VoiceOver:** banner visited link Marcelo Paiva
- 0:52 **VoiceOver:** Last landmark banner
- 0:54 **VoiceOver:** Main navigation
- 0:57 **VoiceOver:** main MARCELO PAIVA group
- 0:59 **VoiceOver:** More essays, by their drawings region
- 1:02 **VoiceOver:** LATEST WRITING region
- 1:04 **Tester:** Each region is announced with a name, so I can tell them apart and jump straight to the one I want.
- 1:14 **Tester:** And links. In a list of links, each one has to make sense on its own.
- 1:20 **VoiceOver:** Marcelo Paiva visited link
- 1:22 **VoiceOver:** Writing link
- 1:25 **VoiceOver:** Work link
- 1:27 **VoiceOver:** Signal link
- 1:29 **VoiceOver:** Tools link
- 1:31 **VoiceOver:** Resume link
- 1:33 **VoiceOver:** Read the writing link
- 1:36 **VoiceOver:** See the work link
- 1:38 **VoiceOver:** How do you keep something powerful approachable? link
- 1:41 **VoiceOver:** How do we learn a spec nobody reads? How do we learn a spec nobody reads? Nobody learns a language by reading its dictionary, and I think that explains most of what is wrong with how we teach accessibility. link
- 1:49 **VoiceOver:** Last link How do we learn a spec nobody reads? How do we learn a spec nobody reads? Nobody learns a language by reading its dictionary, and I think that explains most of what is wrong with how we teach accessibility. link
- 1:52 **Tester:** The essays in the drawing strip read their title twice, and then the whole summary.
- 1:57 **Reviewer:** Each link still makes sense, so WCAG 2.4.4 is met. But a list of links is how people scan a page, and this one takes several seconds per link. It's worth fixing.
- 2:09 **Tester:** Something else, on screen. As I moved through the links, rings stayed behind on links I'd already left. Even now, See the work still has one, though I'm in the drawing strip.
- 2:19 **Reviewer:** That's WCAG 2.4.7, Focus Visible. Someone who sees the screen while using VoiceOver, or a person sitting beside them, needs to find focus at a glance. The page's styles are right: this is a bug in Safari. But people still see it, so the page works around it.
- 2:39 **Reviewer:** Two fixes. Each link is now described by its summary alone, and a small script makes Safari redraw whatever just lost focus. Here's the same list after both changes.
- 2:54 **VoiceOver:** Last link Skip to content link
- 2:57 **VoiceOver:** Marcelo Paiva visited link
- 3:00 **VoiceOver:** Writing link
- 3:02 **VoiceOver:** Work link
- 3:04 **VoiceOver:** Last link Work link
- 3:07 **VoiceOver:** Signal link
- 3:09 **VoiceOver:** Tools link
- 3:11 **VoiceOver:** Resume link
- 3:13 **VoiceOver:** Read the writing link
- 3:16 **VoiceOver:** See the work link
- 3:18 **VoiceOver:** How do you keep something powerful approachable? link
- 3:21 **VoiceOver:** How do we learn a spec nobody reads? Nobody learns a language by reading its dictionary, and I think that explains most of what is wrong with how we teach accessibility. link
- 3:28 **VoiceOver:** Should a design system have a file written for machines? Writing rules for a reader who cannot ask a follow-up question turned out to be the clearest thinking I have done about my own design system. link
- 3:35 **Tester:** Now each essay says its title once, then its summary, and only the link I'm on has a ring.

</details>

<a id="control"></a>

### Step 5: the Set for you control

[![Still from the video: Step 5: the Set for you control. Opens the video, 1:36.](v5.jpg)](v5.mp4)

[Watch the video](v5.mp4) (1:36, captions on screen and as a track) · [captions file](v5.vtt) · [transcript as text](v5.transcript.txt)

The settings button, closely: its name, role and state, what happens when it opens, each setting inside it, and where Escape leaves you.

**Finding.** WCAG 4.1.2 holds: the button says collapsed and expanded, every dropdown has a name and says its value, and Escape puts focus back on the button.

<details>
<summary>Transcript</summary>

- 0:00 **Tester:** Step five, the controls. Finding Set for you isn't enough. It has to say what it is, what state it's in, and work from the keyboard.
- 0:09 **VoiceOver:** Set for you collapsed button
- 0:17 **Tester:** Set for you, a button, collapsed.
- 0:20 **Reviewer:** Name, role and state, all three. That's WCAG 4.1.2.
- 0:25 **VoiceOver:** Set for you expanded button
- 0:31 **Tester:** When I press it, the state changes to expanded, and VoiceOver says so. Now the panel, one item at a time.
- 0:38 **VoiceOver:** THIS SITE, SET FOR YOU group
- 0:41 **VoiceOver:** THIS SITE, SET FOR YOU
- 0:43 **VoiceOver:** Show the drawings
- 0:45 **VoiceOver:** in calm color Drawings Drawings collapsed pop up button, group
- 0:52 **VoiceOver:** , with the theme
- 0:54 **VoiceOver:** following my device Theme collapsed pop up button, group
- 0:58 **VoiceOver:** , and motion
- 0:59 **VoiceOver:** allowed Motion collapsed pop up button, group
- 1:03 **VoiceOver:** . The home page as
- 1:05 **VoiceOver:** a list of essays Home page collapsed pop up button, group
- 1:08 **Tester:** The settings read as a sentence, and each dropdown has its own name… Drawings, Theme, Motion, Home page… with its current value first.
- 1:17 **VoiceOver:** Set for you collapsed button banner
- 1:20 **Tester:** And Escape closes it, and puts me back on the button, collapsed again.
- 1:25 **Reviewer:** Focus isn't lost. Where focus goes when a panel or a dialog closes is one of the most common keyboard problems, and here it's right.

</details>

<a id="task"></a>

### Step 6: a real task, then the fix

[![Still from the video: Step 6: a real task, then the fix. Opens the video, 3:20.](v6.jpg)](v6.mp4)

[Watch the video](v6.mp4) (3:20, captions on screen and as a track) · [captions file](v6.vtt) · [transcript as text](v6.transcript.txt)

Turning the drawings off with VoiceOver, start to finish. It works: the drawings go, for VoiceOver too. But nothing says so: the note that confirms it is only on screen. Then the same task on the fixed version, where the change is announced.

**Finding.** A problem under WCAG 4.1.3 Status Messages, fixed: VoiceOver now says “Drawings are off and their captions go with them.” straight after the choice. WCAG 4.1.3 holds.

<details>
<summary>Transcript</summary>

- 0:00 **Tester:** Step six, a real task. I'll turn the drawings off, start to finish, with VoiceOver… and find out whether it tells me it worked.
- 0:09 **VoiceOver:** Set for you collapsed button
- 0:17 **VoiceOver:** Set for you expanded button
- 0:23 **VoiceOver:** THIS SITE, SET FOR YOU group
- 0:25 **VoiceOver:** THIS SITE, SET FOR YOU
- 0:27 **VoiceOver:** Show the drawings
- 0:29 **VoiceOver:** in calm color Drawings collapsed pop up button, group
- 0:33 **Tester:** There's the Drawings dropdown, set to calm color. I'll open it, and choose not at all.
- 0:38 **VoiceOver:** menu 3 items ✓ in calm color
- 0:42 **VoiceOver:** in full color
- 0:44 **VoiceOver:** not at all
- 0:46 **VoiceOver:** in calm color Drawings Drawings collapsed pop up button, group
- 0:53 **Tester:** When I choose it, VoiceOver reads the old value… calm color.
- 0:58 **Reviewer:** That seems to be VoiceOver in Safari, with a standard dropdown. It isn't the page.
- 1:04 **Tester:** I'll ask again to hear what's set.
- 1:06 **VoiceOver:** not at all Drawings collapsed pop up button, group is in the VoiceOver cursor
- 1:11 **Tester:** Not at all. It worked… but nothing told me. The panel has a note about it, so I'll go and find it.
- 1:17 **VoiceOver:** , with the theme
- 1:19 **VoiceOver:** following my device Theme collapsed pop up button, group
- 1:23 **VoiceOver:** , and motion
- 1:24 **VoiceOver:** allowed Motion collapsed pop up button, group
- 1:28 **VoiceOver:** . The home page as
- 1:30 **VoiceOver:** a list of essays Home page collapsed pop up button, group
- 1:33 **VoiceOver:** .
- 1:35 **VoiceOver:** end of THIS SITE, SET FOR YOU group
- 1:37 **VoiceOver:** Your device is set to dark, so this site is too. Drawings are off, and their captions go with them. Nothing else on a page depends on them.
- 1:42 **Tester:** There it is. Drawings are off, and their captions go with them.
- 1:47 **Reviewer:** That's a status message, and it's only on screen: it should be announced, without going to look. That's a problem under WCAG 4.1.3, Status Messages. Someone listening can't tell whether their choice worked.
- 2:01 **VoiceOver:** Set for you collapsed button
- 2:07 **VoiceOver:** link See the work
- 2:15 **VoiceOver:** LATEST WRITING region
- 2:17 **Tester:** And after See the work, VoiceOver goes straight to Latest writing. The drawings are gone for a listener too.
- 2:26 **Reviewer:** The fix: a status line that says what each change did. Here's the same task on the fixed version, the one that's live now.
- 2:35 **VoiceOver:** Set for you collapsed button
- 2:43 **VoiceOver:** Set for you expanded button
- 2:45 **VoiceOver:** THIS SITE, SET FOR YOU group
- 2:47 **VoiceOver:** THIS SITE, SET FOR YOU
- 2:49 **VoiceOver:** Show the drawings
- 2:51 **VoiceOver:** in calm color Drawings collapsed pop up button
- 2:54 **VoiceOver:** menu 3 items ✓ in calm color
- 2:57 **VoiceOver:** in full color
- 2:59 **VoiceOver:** not at all
- 3:01 **VoiceOver:** in calm color Drawings Drawings collapsed pop up button, Drawings are off and their captions go with them.
- 3:10 **Tester:** There it is: drawings are off, and their captions go with them, said straight after the choice.
- 3:16 **Reviewer:** 4.1.3 holds here.

</details>

<a id="describe"></a>

### Extra: Describe this page, then the fix

[![Still from the video: Extra: Describe this page, then the fix. Opens the video, 2:26.](v8.jpg)](v8.mp4)

[Watch the video](v8.mp4) (2:26, captions on screen and as a track) · [captions file](v8.vtt) · [transcript as text](v8.transcript.txt)

A screen reader reads a page in a line, one item at a time; it doesn’t say what the page looks like. Describe this page puts the layout into words, so someone who is blind gets a map: what is on the page before reading all of it, and where things are when a sighted colleague points to “the column on the right”.

**Finding.** The description works, but on opening VoiceOver read only its name and heading. Fixed: on the live site, it reads the picture of the page straight away.

<details>
<summary>Transcript</summary>

- 0:00 **Reviewer:** One more feature to test: Describe this page. A screen reader reads a page one item at a time, in a line. It doesn't say that the essays fill most of the page, or that a narrow column sits beside them.
- 0:13 **Reviewer:** For someone who's blind, a picture of the layout is a map. It says what's on the page before reading all of it, and where things are when a sighted colleague says it's in the column on the right.
- 0:25 **VoiceOver:** system has new window
- 0:28 **VoiceOver:** Describe this page dialog pop up button
- 0:31 **Tester:** It's the second thing on the page, right after the skip link. I'll press it.
- 0:36 **VoiceOver:** The home page web dialog with 9 items heading level 2 The home page
- 0:41 **Tester:** It says the dialog's name, The home page, and its heading… and stops there. The picture of the page isn't read until I go looking.
- 0:50 **VoiceOver:** Close button
- 0:52 **VoiceOver:** This is the front page of a magazine. The newest essays take most of the page, and a narrower column beside them lists everything else.
- 0:57 **VoiceOver:** heading level 3 From top to bottom
- 1:00 **VoiceOver:** list 7 items
- 1:02 **VoiceOver:** 1
- 1:03 **VoiceOver:** At the top, the site header: my name, which goes home, then links to Writing, Work, Signal, Tools and Resume, then Set for you, where you choose the drawings, theme and motion. Beside it is a button that pauses everything that moves.
- 1:11 **Tester:** It starts with a picture: the front page of a magazine, the newest essays taking most of the page, and a narrower column beside them. Then it walks the layout from top to bottom.
- 1:23 **Reviewer:** What it says is useful. But on opening it only says its name, so someone has to explore to find out what the page is like. That's not a guideline failure, but it holds back the whole point of the feature.
- 1:36 **VoiceOver:** At the top, the site header: my name, which goes home, then links to Writing, Work, Signal, Tools and Resume, then Set for you, where you choose the drawings, theme and motion. Beside it is a button that pauses everything that moves.
- 1:44 **Reviewer:** The fix, now live: the heading carries the description, so it's read the moment the dialog opens. Same steps, on the live site.
- 1:53 **VoiceOver:** link Skip to content
- 1:55 **VoiceOver:** Describe this page dialog pop up button
- 1:58 **VoiceOver:** The home page web dialog with 9 items heading level 2 The home page This is the front page of a magazine. The newest essays take most of the page, and a narrower column beside them lists everything else.
- 2:06 **Tester:** This time it reads the picture straight away: the front page of a magazine, the newest essays taking most of the page.
- 2:14 **Reviewer:** Now the feature does its job from the first second. Whether the description helps is for blind people to tell us.
- 2:22 **VoiceOver:** Describe this page dialog pop up button

</details>

## Recommendations: test with people with disabilities

This was a first pass. It shows whether things work as built, not whether they help the people they are for. These need people with disabilities, using their own devices and settings:

<a id="recommendations-video"></a>

### The recommendations, on screen

[![Still from the video: The recommendations, on screen. Opens the video, 3:52.](v9.jpg)](v9.mp4)

[Watch the video](v9.mp4) (3:52, captions on screen and as a track) · [captions file](v9.vtt) · [transcript as text](v9.transcript.txt)

Each area that needs testing with people with disabilities, shown on the page as it is named: the Describe this page dialog, the Set for you sentence, the moving drawings, the page zoomed in, and the Home page setting that switches to the collage.

<details>
<summary>Transcript</summary>

- 0:00 **Reviewer:** Last, what this first pass can't tell us. A screen reader shows whether things work as built, not whether they help the people they're for. These need people with disabilities, on their own devices and settings. I'll show each one on the page as we name it.
- 0:15 **Tester:** First, Describe this page. I'll press Tab twice, to its button in the skip links, then Return to open it.
- 0:22 **Keyboard:** Tab → link, Skip to content
- 0:24 **Keyboard:** Tab → button, Describe this page
- 0:26 **Keyboard:** Return → heading, The home page
- 0:28 **Tester:** A dialog sits over the dimmed page, titled The home page: one sentence comparing it to the front page of a magazine, then a numbered list of its parts, top to bottom, and a Close button at the top. Does a description like this help someone picture the page? Is it too long, or too short? Blind people who use a screen reader every day should tell us, on VoiceOver and on JAWS or NVDA.
- 0:52 **Tester:** I'll press Escape to close it.
- 0:54 **Keyboard:** Escape → button, Describe this page
- 0:56 **Reviewer:** Second, other screen readers and devices. We're back on the home page. This pass used VoiceOver in Safari only, and its biggest finding came from how Safari passes hidden content to VoiceOver. JAWS, NVDA, VoiceOver on iPhone and TalkBack all behave differently.
- 1:14 **Tester:** Third, Set for you. I'll Tab across the header: my name, Writing, Work, Signal, Tools and Resume, then Set for you, and press Return to open it.
- 1:24 **Keyboard:** Tab → link, Marcelo Paiva
- 1:25 **Keyboard:** Tab → link, Writing
- 1:27 **Keyboard:** Tab → link, Work
- 1:29 **Keyboard:** Tab → link, Signal
- 1:30 **Keyboard:** Tab → link, Tools
- 1:32 **Keyboard:** Tab → link, Resume
- 1:33 **Keyboard:** Tab → button, Set for you, collapsed
- 1:35 **Keyboard:** Return → button, Set for you, expanded
- 1:37 **Tester:** A small panel drops down with one sentence: show the drawings in calm color, with the theme following my device, and motion allowed. The home page as a list of essays. Each of those choices is a dropdown. Whether a sentence like that feels natural, and whether the announcements are enough, is for screen reader users, and people with cognitive or learning disabilities, to say.
- 2:00 **Tester:** Escape closes the panel.
- 2:03 **Keyboard:** Escape → button, Set for you, collapsed
- 2:05 **Reviewer:** Fourth, motion. Under the introduction, a band of drawings drifts slowly sideways, and thin lines and points move across the dark background behind the heading. A pause button sits beside Set for you. It works… but is it found in time, and is the motion comfortable before it is? People with vestibular disorders can tell us.
- 2:23 **Tester:** Fifth, zoom and magnification. I'll zoom in, pressing Command-Plus three times.
- 2:29 **Keyboard:** Command-Plus: zooms the page
- 2:31 **Keyboard:** Command-Plus: zooms the page
- 2:33 **Keyboard:** Command-Plus: zooms the page
- 2:35 **Tester:** The heading now fills most of the width, the header stays across the top, and the text sits over the moving background. People with low vision who use zoom or a screen magnifier should try it.
- 2:48 **Tester:** Command-Zero puts the page back to its normal size.
- 2:52 **Keyboard:** Command-0: back to actual size
- 2:54 **Reviewer:** Sixth, voice control and switch access. Names were checked for what a screen reader says, not for what people say aloud, and the home page has more than fifty stops for someone moving one step at a time.
- 3:06 **Tester:** And last, the collage. I'll press Return to open Set for you again, then Tab past Drawings, Theme and Motion, to its last dropdown.
- 3:16 **Keyboard:** Return → button, Set for you, expanded
- 3:18 **Keyboard:** Tab → pop-up button, Drawings, in calm color
- 3:19 **Keyboard:** Tab → pop-up button, Theme, following my device
- 3:21 **Keyboard:** Tab → pop-up button, Motion, allowed
- 3:23 **Keyboard:** Tab → pop-up button, Home page, a list of essays
- 3:24 **Keyboard:** Focus is on → pop-up button, Home page, a list of essays
- 3:25 **Tester:** The Home page dropdown reads a list of essays. Choosing a collage of drawings there turns the home page into a field of pictures. This pass tested the list only.
- 3:36 **Tester:** Escape closes it.
- 3:38 **Keyboard:** Escape → button, Set for you, collapsed
- 3:40 **Tester:** That's the end of the first pass. Six problems found on the page: five fixed and live, and one still open.
- 3:48 **Reviewer:** The next test is with people.

</details>

- **Describe this page.** Whether a written description of the layout actually helps someone build a picture of the page, whether it says too much or too little, and whether people find the button where it is. A screen reader can show the dialog works; only the people it is for can say it helps.<br>Who: blind people who use a screen reader every day, on VoiceOver and on JAWS or NVDA.
- **Other screen readers and devices.** This pass used VoiceOver in Safari only, and its biggest finding came from how Safari passes hidden content to VoiceOver. JAWS and NVDA on Windows, VoiceOver on iPhone and TalkBack on Android behave differently.<br>Who: people who use each of them daily, on their own devices and settings.
- **Set for you, as a sentence of settings.** The panel reads its settings as a sentence, with a dropdown in each part. Whether that reads naturally, and whether the new announcements are enough to know what changed, is a question of experience, not of code.<br>Who: screen-reader users, and people with cognitive or learning disabilities.
- **Motion.** The band of drawings drifts and the background moves. The pause button and reduced-motion setting were checked to work, not whether they are found in time or whether the motion is comfortable before they are.<br>Who: people with vestibular disorders, and people for whom motion makes reading harder, such as some people with ADHD.
- **Zoom and magnification.** The header stays at the top of the screen, and some text sits over moving colour that the site measures but doesn’t yet grade. How that feels at high zoom or under a screen magnifier wasn’t part of this pass.<br>Who: people with low vision who use browser zoom or a screen magnifier.
- **Voice control and switch access.** Controls were checked for names a screen reader announces, not for names people would say aloud, and the home page has more than fifty stops from top to bottom for someone moving one step at a time.<br>Who: people who use Voice Control or switch access, and others with motor disabilities.
- **The collage layout.** Set for you can swap the home page’s list of essays for a collage of drawings. This pass tested the list only.<br>Who: screen-reader and keyboard users.

---

A first pass, made October 16–17, 2026. If something here doesn’t work for you, that is a bug: <a href="mailto:mpaiva@gmail.com">email me</a>, and say what you were trying to do and what you were using.
