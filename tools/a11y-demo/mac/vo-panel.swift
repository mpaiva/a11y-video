// VoiceOver's caption panel, for filming it beside Safari.
//
//   vo-panel find                  prints the panel's bounds as JSON {"x","y","w","h"} (global points,
//                                  top-left origin), or nothing when VoiceOver shows no panel
//   vo-panel drag X1 Y1 X2 Y2      presses the mouse at (X1, Y1), drags to (X2, Y2) and lets go
//   vo-panel move X Y              moves the pointer to (X, Y), to park it outside the filmed area
//
// The panel is a VoiceOver window on layer 3000 that the accessibility API does not expose, so System
// Events can neither see nor move it; the window server lists it, and VoiceOver lets a person drag it.
// Guidepup runs VoiceOver on a preference set it throws away after each take, so a position saved in
// VoiceOver Utility never reaches a take: vo-lib.mjs drags the panel into place at the start of each.
// Built on first use by vo-lib.mjs (swiftc, from the Xcode command line tools).
import CoreGraphics
import Foundation

let args = Array(CommandLine.arguments.dropFirst())
switch args.first {
case "find":
  let windows = CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as? [[String: Any]] ?? []
  for w in windows where (w[kCGWindowOwnerName as String] as? String) == "VoiceOver"
    && (w[kCGWindowLayer as String] as? Int) == 3000 {
    let b = w[kCGWindowBounds as String] as? [String: Double] ?? [:]
    print("{\"x\":\(b["X"] ?? 0),\"y\":\(b["Y"] ?? 0),\"w\":\(b["Width"] ?? 0),\"h\":\(b["Height"] ?? 0)}")
  }
case "drag" where args.count == 5:
  let n = args.dropFirst().compactMap { Double($0) }
  let from = CGPoint(x: n[0], y: n[1]), to = CGPoint(x: n[2], y: n[3])
  func post(_ type: CGEventType, _ at: CGPoint) {
    CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: at, mouseButton: .left)?.post(tap: .cghidEventTap)
    usleep(12_000)
  }
  post(.mouseMoved, from); usleep(150_000)
  post(.leftMouseDown, from); usleep(150_000)
  for i in 1...30 {
    let f = Double(i) / 30
    post(.leftMouseDragged, CGPoint(x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f))
  }
  usleep(150_000); post(.leftMouseUp, to)
case "move" where args.count == 3:
  let n = args.dropFirst().compactMap { Double($0) }
  CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: CGPoint(x: n[0], y: n[1]),
          mouseButton: .left)?.post(tap: .cghidEventTap)
default:
  FileHandle.standardError.write("usage: vo-panel find | vo-panel drag X1 Y1 X2 Y2 | vo-panel move X Y\n".data(using: .utf8)!)
  exit(2)
}
