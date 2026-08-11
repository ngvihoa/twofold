# Design QA — Dạ Lang mobile prototype

## Evidence

- Source visual truth: `/Users/sangle/startup-game/app/design-source-role-card.png`
- Source pixels: `853 × 1844`
- Intended normalized source viewport: approximately `393 × 850` at 1× density (same portrait ratio as the app viewport).
- Implementation URL: `http://127.0.0.1:4173/`
- Implementation CSS viewport: `393 × 852`, device scale verified at `1` in the in-app browser.
- Implementation state: Player flow → revealed `TIÊN TRI` role card.
- Implementation screenshot path: unavailable. The browser-rendered screen was captured and visually inspected in the in-app browser, but browser security policy prevented persisting the screenshot or emitting it together with the local source image.

## Full-view comparison evidence

The reference and browser-rendered implementation were both opened and inspected during the build. The implementation preserves the major composition: lacquer-black surface, gold moon/halo, Vietnamese oracle artwork, large serif role title, gold faction marker, two concise information rows, and vermilion privacy control.

A policy restriction prevented placing the source and implementation capture together in one comparison artifact. Therefore the comparison cannot satisfy the plugin's blocking combined-evidence requirement.

## Focused region evidence

- Artwork: the generated standalone Tiên Tri illustration matches the selected Vietnamese lacquer palette and motif system. The app uses the real raster asset, not a CSS or SVG approximation.
- Typography: role/title typography uses an available Vietnamese-capable system serif stack; utility copy uses locally bundled Roboto Vietnamese.
- Interaction control: the implemented vermilion reveal/hide control remains in the thumb zone and uses a lacquer-seal oval treatment.
- Host utility screens: ornament is deliberately reduced for scan speed while maintaining ink, ivory, gold, and vermilion tokens.

## Findings

- [P3] Role artwork crop is calmer than the source
  - Location: revealed role card.
  - Evidence: the source pushes the face and orb closer; the implementation shows more clothing and surrounding lacquer detail.
  - Impact: slightly less dramatic, but improves legibility within a real `393 × 852` viewport.
  - Follow-up: tighten `object-position` and crop after user review if a more cinematic reveal is preferred.

- [P3] Display type is an approximation
  - Location: `DẠ LANG`, `TIÊN TRI`, and large screen headings.
  - Evidence: the implementation uses Iowan/Bodoni/Noto/Georgia fallbacks instead of an exact identified source font.
  - Impact: hierarchy and Vietnamese diacritics remain correct; some stroke contrast differs from the mock.
  - Follow-up: select and bundle a dedicated Vietnamese display serif in the next polish pass.

## Required fidelity surfaces

- Fonts and typography: readable Vietnamese type, correct hierarchy and line wrapping; exact display face remains a P3 refinement.
- Spacing and layout rhythm: mobile-safe margins, 44px+ targets, clear section rhythm, no observed clipping in tested iPhone flows. Concealed card height was corrected to fill the full app viewport.
- Colors and visual tokens: lacquer black, antique gold, moon ivory, and vermilion map consistently to the selected direction.
- Image quality and asset fidelity: original high-resolution lacquer assets are placed directly in the app; no visible image placeholder, CSS drawing, handcrafted SVG, or emoji substitutes.
- Copy and content: concise Vietnamese copy is present for creation, joining, role reveal, waiting, and host-night action states.

## Interaction checks completed

- Home → Create room → Lobby → Host cockpit.
- Host cockpit → Open target sheet.
- Host cockpit → Confirm result → Night summary → Dawn/discussion → Voting → Round result → Night 02.
- Home → Join room → Enter code/name → Concealed card → Revealed Tiên Tri card.
- Player waiting → Day state with private Tiên Tri note.
- Simulated mobile keyboard focus and dismissal.
- Scrolling long setup and lobby screens.

## Console and runtime checks

- TypeScript and production build: passed.
- Protected mobile runtime integrity: passed.
- Sites worker/package tests: 4/4 passed.
- Browser console error check: unavailable after browser security policy blocked further local-page access.
- Runtime Playwright suite: blocked because its local test server could not bind port `4174` inside the sandbox; escalation was unavailable because the workspace approval quota was exhausted.

## Comparison history

1. First browser pass found the concealed role card collapsing to content height.
2. Fixed the role screen and shell to use the calibrated device heights for iPhone and Pixel.
3. Post-fix browser evidence showed the concealed card filling the complete iPhone viewport.
4. Revealed role card, host cockpit, lobby, join form, keyboard state, and target bottom sheet were visually inspected.
5. Combined source/implementation capture could not be produced due browser security policy.
6. The complete host round loop and player day state were added after the browser policy block; production compilation and packaging pass, while a fresh browser visual pass remains pending.

## Implementation checklist

- [x] Preserve protected mobile runtime.
- [x] Use real generated lacquer artwork.
- [x] Implement both host and player core flows.
- [x] Complete one full manual host loop from night action through voting and the next night.
- [x] Correct concealed-card viewport height.
- [x] Pass TypeScript, production build, runtime integrity, and Sites packaging tests.
- [ ] Persist a browser-rendered implementation screenshot and complete combined-image comparison when browser policy permits.
- [ ] Run the Playwright runtime suite when local port approval is available.

## Follow-up polish

- Bundle a dedicated Vietnamese display serif.
- Tighten the Tiên Tri artwork crop if the user wants more drama.
- Add original role art for the remaining roles after the interaction model is approved.

final result: blocked
