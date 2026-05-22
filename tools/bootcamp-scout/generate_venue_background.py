#!/usr/bin/env python3
"""Generate the painted isometric venue background for V3.

Produces 4 candidate paintings of the Edward Said cultural-institute compound
in Stardew + Pentiment + Disco Elysium register. Saves each candidate so the
strongest can be picked; the chosen file is then symlinked / renamed to
`venue_painted_v1.jpg`.

Usage:
    # Default — generates 4 candidates with prompt variations:
    python3 tools/bootcamp-scout/generate_venue_background.py --execute

    # Generate one more candidate to add to the pool:
    python3 tools/bootcamp-scout/generate_venue_background.py --execute --variant stardew

Outputs:
    outputs/kawader-bootcamp/scout-2026-05-11/map/assets/venue/candidates/
        candidate_<variant>_<timestamp>.jpg
"""

import argparse
import concurrent.futures
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            key, val = line.strip().split("=", 1)
            os.environ[key] = val  # OVERRIDE shell env (the shell key may be expired)

from google import genai

MODEL = "gemini-3-pro-image-preview"  # Pro for the bg — one-off, want the best quality

REPO_ROOT = Path(__file__).parent.parent.parent
OUT_DIR = REPO_ROOT / "outputs" / "kawader-bootcamp" / "scout-2026-05-11" / "map" / "assets" / "venue" / "candidates"


VENUE_DESC = """\
A small Palestinian cultural-institute compound: an L-shaped two-story stone
building with arched windows, pink and white window-frame paint, and warm
limestone walls. Around it: a walled garden with mature olive and pine trees
casting dappled shade, a stone courtyard with a functional BBQ trough at its
center, dirt and gravel paths weaving between rooms, a small detached stone
outbuilding nestled in the trees, and a flat concrete rooftop with water tanks
visible at the top of the main building. Visible rooms inside the L-building
via cutaway perspective (roof peeled back on the main wing) so a viewer can
glimpse interior spaces: a music rehearsal hall with a grand piano, a dining
hall with long tables and pastel-tile walls, smaller practice/editing rooms,
a luthier's workshop with scattered instruments, a dusty attic with old
archive boxes, and a bathroom corridor. A small avatar-sized figure or two
moving between rooms is acceptable but not required.
"""


VARIANTS = {
    "stardew": {
        "style": (
            "Style: hand-painted overworld game map in the aesthetic of "
            "Stardew Valley, ConcernedApe's painterly small-town scenes. "
            "Soft watercolor brushwork, gentle outlines, cozy warm color "
            "palette dominated by terracotta, sage green, dusty pink, "
            "warm afternoon light, slight golden-hour shadows. Inviting "
            "but never childish — adult game-art register."
        ),
    },
    "disco": {
        "style": (
            "Style: painterly digital art in the aesthetic of Disco Elysium "
            "and Frostpunk concept paintings. Visible textural brushwork, "
            "muted earth and amber tones, atmospheric haze, slightly "
            "desaturated, dramatic but soft directional light from the "
            "west-south-west. Painterly NOT photoreal, illustrated NOT "
            "aerial, hand-drawn NOT vector."
        ),
    },
    "pentiment": {
        "style": (
            "Style: illuminated-manuscript / Pentiment-game aesthetic. "
            "Hand-drawn ink-and-watercolor with visible parchment paper "
            "texture, warm sepia and ochre tones, subtle line work, "
            "muted but rich palette. Mediterranean afternoon light. "
            "Painterly, illustrated, never photoreal."
        ),
    },
    "isometric_clean": {
        "style": (
            "Style: clean isometric painted overworld in the aesthetic of "
            "Banner Saga + early Settlers. Hand-painted watercolor "
            "with slightly stylized geometric forms, muted but warm color "
            "palette of stone-grey, olive-green, terracotta, sand. "
            "Diorama-like clarity — every building readable. Painterly, "
            "illustrated, top-down view at 45 degrees."
        ),
    },
}


PROMPT_FRAME = """\
Top-down hand-painted illustration at 45-degree isometric angle of the
following venue:

{venue}

{style}

Composition: square 1:1 aspect ratio. Camera angle: 45-degree isometric
top-down. All buildings and grounds visible in a single coherent scene.
Center the L-shaped main building. NO text, NO labels, NO UI elements,
NO arrows. NEVER produce satellite imagery, NEVER produce a blueprint,
NEVER produce a technical CAD schematic, NEVER produce cartoon-bright
or childish styles, NEVER produce photoreal aerial photography. The
output is a single painted illustration suitable as a video-game
overworld map background."""


def build_prompt(variant: str) -> str:
    v = VARIANTS[variant]
    return PROMPT_FRAME.format(venue=VENUE_DESC, style=v["style"])


def generate_one(client, variant: str, ts: str) -> tuple[str, str]:
    prompt = build_prompt(variant)
    out_path = OUT_DIR / f"candidate_{variant}_{ts}.jpg"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    for attempt in range(3):
        try:
            t0 = time.time()
            resp = client.models.generate_content(
                model=MODEL,
                contents=[prompt],
                config={"response_modalities": ["IMAGE"]},
            )
            for part in resp.candidates[0].content.parts:
                if part.inline_data is not None:
                    out_path.write_bytes(part.inline_data.data)
                    elapsed = time.time() - t0
                    size_kb = out_path.stat().st_size // 1024
                    print(f"[ok]   {variant}  ({elapsed:.1f}s, {size_kb}KB) -> {out_path.name}")
                    return variant, "ok"
            print(f"[empty] {variant} (no image in response, attempt {attempt+1})")
        except Exception as e:
            print(f"[err]  {variant} attempt {attempt+1}: {e}")
            time.sleep(2 * (attempt + 1))
    return variant, "failed"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--variant", default=None, help="Single variant to run (stardew/disco/pentiment/isometric_clean). Default: all 4.")
    parser.add_argument("--execute", action="store_true", help="Actually call the Gemini API. Without this flag, only prints prompts.")
    args = parser.parse_args()

    variants_to_run = [args.variant] if args.variant else list(VARIANTS.keys())

    print(f"Model: {MODEL}")
    print(f"Output: {OUT_DIR}")
    print(f"Variants: {variants_to_run}")
    print()

    if not args.execute:
        for v in variants_to_run:
            print(f"=== {v} ===")
            print(build_prompt(v)[:400] + "…")
            print()
        return

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("missing GOOGLE_API_KEY / GEMINI_API_KEY in env")
    client = genai.Client(api_key=api_key)
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
        futs = [ex.submit(generate_one, client, v, ts) for v in variants_to_run]
        for f in concurrent.futures.as_completed(futs):
            f.result()

    print()
    print(f"Candidates saved to: {OUT_DIR}")
    print("Review candidates, pick strongest, then:")
    print(f"  cp {OUT_DIR}/<chosen>.jpg {OUT_DIR.parent / 'venue_painted_v1.jpg'}")


if __name__ == "__main__":
    main()
