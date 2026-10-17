# One-time setup

The capture drives VoiceOver, Safari and the screen recorder through macOS automation, and records
VoiceOver's speech through a loopback audio device. Each item below is either an install or a
privacy or VoiceOver setting that a person grants. Claude cannot grant them and should not try: hand
the requester this list and wait for them to say it is done. "The app" means whatever runs the
scripts (the Claude desktop app, or Terminal): grant each permission to that app.

First run demo-video's `tools/demo-video/doctor.sh` (ffmpeg, uv, Kokoro, Playwright's Chromium and the
font), then `npm install` in `tools/a11y-demo`.

## VoiceOver under automation

1. `npx @guidepup/setup setup --macos-ignore-tcc-db`. The `setup` subcommand matters: without it the
   tool prints help. The flag skips writing macOS's privacy database, which is for CI machines; the
   permissions below are granted by hand instead. If asked, tick "Allow VoiceOver to be controlled
   with AppleScript" in VoiceOver Utility › General.
2. `npx @guidepup/setup install voiceover`: Guidepup's VoiceOver preferences for this macOS version (a
   ~10 MB disk image from the `guidepup/voiceover` GitHub releases, checked against a SHA-256). During
   a take Guidepup swaps them in and restores the person's own afterwards. Rerun after a macOS
   upgrade.
3. Privacy & Security › **Full Disk Access**: the app. Guidepup links its preferences into VoiceOver's
   folder, which macOS otherwise refuses even to list ("EPERM … symlink").
4. Privacy & Security › **Accessibility**: the app (it sends VoiceOver's keys).
5. **Automation**: allow the app to control VoiceOver, Safari and System Events when asked.
6. Privacy & Security › **Screen & System Audio Recording**: the app.

## Safari

7. Settings › Advanced › "Press Tab to highlight each item on a webpage". Without it Tab skips links.
8. Settings › Advanced › "Show features for web developers", then Developer › "Allow JavaScript from
   Apple Events". The runner uses it to wait for each load and to put focus inside the page.

## VoiceOver's voice on the soundtrack

9. `brew install blackhole-2ch` (asks for a password). BlackHole 2ch is a virtual audio device: what
   is played into it can be recorded from it.
10. For each take, set the Mac's sound output to **BlackHole 2ch** (System Settings › Sound ›
    Output), and back afterwards. VoiceOver speaks through the Mac's output, so the take records it
    from BlackHole; nobody hears it live. The runner checks this and refuses to start a take without
    it. Changing VoiceOver's own output device or its Hints setting in VoiceOver Utility does not
    reach a take: Guidepup runs VoiceOver on its own preference set, mounted fresh for each take and
    thrown away after (its changes go to a temporary shadow file). So hints are stopped by ear
    instead: the runner listens to BlackHole as it records, and when VoiceOver goes quiet after a
    phrase it presses Control, VoiceOver's "stop speech", before the hint's delay runs out.

## Before every take

- Close VoiceOver Utility (the runner does if it can). Its window takes VoiceOver's cursor.
- Sound output on BlackHole 2ch; Do Not Disturb on, so no notification sound reaches the track;
  keyboard and mouse left alone. Anything that appears over Safari is filmed.
- Check the take straight away: the runner prints every phrase. A phrase that is a macOS dialog, the
  toolbar ("toolbar", "vertical splitter") or VoiceOver Utility means the take is wrong, not the page.
