#!/usr/bin/env python3
"""Derive a walkable-area alpha mask from the painted venue background.

Phase 2 step 1 of the overnight V3 run. Generates 3 candidate masks at
different thresholds + morphological ops. Phase 2 step 2 (next firing)
will use a Playwright probe to pick the best candidate against known
walkable / non-walkable coordinates from layout.json + hand-picked walls.

Output: venue_walkable_v1.png (1024x1024, alpha-only PNG) at the chosen
threshold, plus the 3 candidates in candidates/.

Headless-only — no manual Pixelmator polish (per patched plan).

Usage:
    python3 tools/bootcamp-scout/derive_walkable_mask.py
"""
from pathlib import Path
from PIL import Image, ImageFilter

REPO = Path(__file__).parent.parent.parent
SRC = REPO / "outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/venue_painted_v1.jpg"
DST_DIR = REPO / "outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue"
CAND_DIR = DST_DIR / "walkable_candidates"

CANDIDATES = [
    # (name, luminance_threshold, dilate_px, erode_px)
    ("loose", 110, 3, 0),    # more walkable area, more wall-bleed
    ("medium", 120, 3, 1),   # baseline per the handoff
    ("strict", 130, 2, 2),   # less walkable, cleaner edges
]

def derive(threshold: int, dilate_px: int, erode_px: int) -> Image.Image:
    img = Image.open(SRC).convert("L")
    # Binarize: pixels above threshold = walkable (alpha 255), else 0
    mask = img.point(lambda p: 255 if p >= threshold else 0, mode="L")
    # Smooth with morphology approximations (MaxFilter = dilation, MinFilter = erosion)
    for _ in range(dilate_px):
        mask = mask.filter(ImageFilter.MaxFilter(3))
    for _ in range(erode_px):
        mask = mask.filter(ImageFilter.MinFilter(3))
    # Slight smoothing to soften staircase edges
    mask = mask.filter(ImageFilter.GaussianBlur(1.0))
    # Re-binarize after blur so we have crisp alpha
    mask = mask.point(lambda p: 255 if p >= 128 else 0, mode="L")
    return mask

def to_alpha_png(mask: Image.Image) -> Image.Image:
    """Convert grayscale mask to RGBA where alpha=mask. RGB is solid (255,200,80) for visualization."""
    rgba = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    pixels = []
    for v in mask.getdata():
        if v > 0:
            pixels.append((255, 200, 80, v))
        else:
            pixels.append((0, 0, 0, 0))
    rgba.putdata(pixels)
    return rgba

def main():
    if not SRC.exists():
        raise SystemExit(f"missing: {SRC}")
    CAND_DIR.mkdir(parents=True, exist_ok=True)

    for name, thr, dil, ero in CANDIDATES:
        mask = derive(thr, dil, ero)
        # Coverage = walkable pixels / total
        walkable = sum(1 for v in mask.getdata() if v > 0)
        total = mask.size[0] * mask.size[1]
        coverage = walkable / total * 100
        # Save raw 1-channel mask (smaller)
        raw_path = CAND_DIR / f"walkable_{name}_raw.png"
        mask.save(raw_path)
        # Save RGBA visualization for human review
        rgba = to_alpha_png(mask)
        rgba_path = CAND_DIR / f"walkable_{name}_overlay.png"
        rgba.save(rgba_path)
        print(f"[{name}] threshold=L>={thr}  dilate={dil}px  erode={ero}px  coverage={coverage:.1f}%  ->  {raw_path.name}")

    # Pick "medium" as default per handoff baseline; Phase 2 step 2 will swap if probe disagrees
    default = CAND_DIR / "walkable_medium_raw.png"
    out = DST_DIR / "venue_walkable_v1.png"
    out.write_bytes(default.read_bytes())
    print(f"\nDefault (medium) -> {out.relative_to(REPO)}")

if __name__ == "__main__":
    main()
