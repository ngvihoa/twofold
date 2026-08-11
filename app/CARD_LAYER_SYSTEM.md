# Dạ Lang card layer system

## Canonical canvas

- Every raster layer uses the same `1024 × 1536` portrait canvas.
- Every transparent layer keeps its original canvas size. Do not crop to visible pixels.
- Card copy, role name, faction, ability and win condition remain live React UI and are never baked into an image.

## Render order

| Z | Layer | Scope | Purpose |
|---|---|---|---|
| 00 | Background fill | Shared or faction | Lacquer color, texture and broad tonal balance |
| 10 | Ornaments / halo | Shared | Gold halo and Vietnamese ornamental atmosphere behind the subject |
| 20 | Role environment | Per role | Bamboo, lotus, flowers, animals or symbolic environment behind the subject |
| 30 | Subject | Per role | Character portrait with transparent background |
| 40 | Focus object | Optional per role | Orb, weapon, potion or another prop that must sit in front of the subject |
| 50 | Foreground effects | Optional per role | Foil glints, particles or cloud wisps animated independently |
| 60 | Outer frame overlay | Shared | Lacquer-and-gold border, reinforced corners and top/bottom crests |
| 80 | Shared finish | Optional shared | Final vignette or print wear |
| 90 | UI copy | Live React UI | Role name, faction, ability and win condition |

The current Tiên Tri master uses layers `00`, `10`, `20`, `30`, `40`, `50`, shared frame `60` and live React UI copy. The frame is a full-canvas RGBA overlay rendered above both artwork and copy, so replacing one shared file changes the outer frame across every card.

## Runtime

- Production UI: React + TypeScript + Vite.
- Motion: `motion/react`, with each raster layer animated independently and reduced-motion respected.
- `/card-lab.html` is a development-only asset inspector. It is not the app architecture and contains no game flow.

## Reuse rules

1. Shared assets live once under `layers/shared/` and are referenced by every card. Never copy them into role folders.
2. Role assets live under `layers/roles/{role-slug}/`.
3. Update a shared path in `card-manifest.json` to change every card at once.
4. Keep filenames versioned (`-v1`, `-v2`) so a visual experiment never destroys an approved asset.
5. Keep chroma-key generation sources under `sources/`; runtime code only references final RGBA files under `layers/`.
6. New role subjects must be generated with the same anchor points: face near `y=460`, hands or primary action near `y=900`, quiet UI zone below `y=1320`.
7. Host deck-picker thumbnails use derived `256 × 384` `-thumb` files. Keep the canonical 1024×1536 assets for reveal screens and motion compositions.
8. The active outer frame is `60-frame-overlay-v2.png`: a hairline frame designed to keep more than 94% of the card canvas unobstructed. `v1` remains available as the heavier ornamental alternative.

## Current master

- Role: Tiên Tri
- Style: Sơn mài ánh trăng
- Status: seven-layer proof complete
- Inspector: `/card-lab.html`

All ten MVP roles now have an approved `30-subject` layer. Tiên Tri remains the seven-layer master; the other nine cards currently combine shared layers `00`, `10` and `60` with their role-specific subject and live React copy. Role-specific environment, focus and foreground layers can be added later without replacing the subject art or outer frame.
