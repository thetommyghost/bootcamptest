#!/usr/bin/env python3
"""Generate game-asset workshop mockups for the Bootcamp Scout V2 briefing pane.

For each (hero zone × activity) pair, generate a painterly tactical-game
illustration via Gemini Flash Image and stash it under
`outputs/kawader-bootcamp/scout-2026-05-11/map/assets/mockups/<zone>/<slug>.jpg`,
plus a `manifest.json` that the simulation reads to wire activities → images.

Default mode is DRY-RUN — prints prompts and target paths, makes no API calls.
Pass `--execute` to actually generate. `--zones z01,z06,...` to filter.
`--regen <zone>:<slug>` to force-regenerate a specific image.

Usage:
    # Dry-run all 7 hero zones (no API calls, prints plan):
    python3 tools/bootcamp-scout/generate_mockups.py

    # Generate the test batch (5 zones):
    python3 tools/bootcamp-scout/generate_mockups.py \\
        --zones z01,z06,z07,z08,z11 --execute

    # Generate the final 2 zones once style is validated:
    python3 tools/bootcamp-scout/generate_mockups.py \\
        --zones z05,z10 --execute

    # Regenerate a single image:
    python3 tools/bootcamp-scout/generate_mockups.py \\
        --regen z06_music_hall_grand_piano:score_to_picture --execute
"""

import argparse
import concurrent.futures
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Load .env (matches tools/generate_image.py convention)
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            key, val = line.strip().split("=", 1)
            os.environ.setdefault(key, val)

from google import genai

MODEL = "gemini-3.1-flash-image-preview"
STYLE_TAG = "game-asset-v1"

REPO_ROOT = Path(__file__).parent.parent.parent
OUT_DIR = REPO_ROOT / "outputs" / "kawader-bootcamp" / "scout-2026-05-11" / "map" / "assets" / "mockups"
MANIFEST_PATH = OUT_DIR / "manifest.json"


STYLE_BLOCK = """\
Style: painterly digital game art with visible textural brushwork, three-quarter
or low-angle composition, muted color palette dominated by deep gunmetal grays,
warm signal-amber light accents and occasional tactical-green secondary tones,
slightly desaturated atmosphere, gentle film grain, soft volumetric haze. Small
stylized human figures — Palestinian filmmakers and crew with cameras, sound
booms, lighting rigs — suggested in painterly silhouette, no detailed faces.

Mood: tactical mission briefing card from a video-game-style ops console. Think
Frostpunk concept art, Disco Elysium painted scenes, XCOM mission illustrations,
Citizen Sleeper / Hardspace: Shipbreaker key art. Playful but serious — NEVER
childish, NEVER bright cartoon, NEVER flat vector, NEVER photoreal stock-photo.
No logos, no text, no titles inside the image. No Western military uniforms —
this is a film bootcamp, not a soldier's brief.

4:3 aspect ratio."""


# ---------------------------------------------------------------------------
# Hero zone × activity matrix
# ---------------------------------------------------------------------------
# Sourced directly from data.json so the activity strings stay verbatim.
# Each entry: (zone_id, callsign, scene_prompt, [activities])

HERO_ZONES = [
    (
        "z01_sammer_workshop",
        "WP-01",
        "A sunlit Palestinian luthier's workshop: scattered violins and mandolins "
        "on a wooden workbench, hand tools and chisels hanging on rough plaster "
        "walls, soft daylight from a rear window overlooking an olive grove valley, "
        "wood shavings on the floor, jars of varnish on shelves.",
        [
            "Documentary subject: Sammer (luthier) — own doc thread",
            "Hands-on B-roll workshop: cinematography of craft (close-ups, hands, tools)",
            "Sound design exercise: tap, scrape, string-pluck textures recorded room-tone",
        ],
    ),
    (
        "z05_roof",
        "WP-05",
        "A flat concrete rooftop above Birzeit with 360° panorama of warm stone "
        "façades and distant hills, weathered water tanks and a stairwell hut as "
        "foreground anchors, open sky transitioning through golden-hour into dusk, "
        "low parapet wall, antennas and satellite dishes against the sky.",
        [
            "Natural-light workshop (reflections, controlling light, multiple windows)",
            "Sunrise / sunset photography sessions",
            "Golden-hour cohort portraits (1 hr before sunset = ~18:25)",
            "Drone / overhead establishing shots of Birzeit (pending venue + Civil Aviation permission)",
        ],
    ),
    (
        "z06_music_hall_grand_piano",
        "WP-06",
        "A high-ceilinged music rehearsal hall with a grand piano as centerpiece, "
        "rows of ~30 mismatched chairs, pink and white acoustic panels lining the "
        "walls, soft daylight streaming in from tall multi-pane windows, scuffed "
        "wood floor, music stands clustered around the piano.",
        [
            "Plenary briefings + screenings (bring our own projector + screen)",
            "Score-to-picture workshop (use the grand piano)",
            "Director Q&A / masterclass setup",
            "Group critique sessions",
        ],
    ),
    (
        "z07_dining_hall",
        "WP-07",
        "A spacious Palestinian cafeteria with long communal dining tables, pastel "
        "pink and peach tiled accent walls, large bright windows filling the space "
        "with warm daylight, plastic chairs stacked along one wall, a serving "
        "counter at the back, the room set for a meal.",
        [
            "Meals (breakfast / lunch / dinner — meals plan owner: TBD)",
            "Evening recap circles",
            "Doubles as classroom overflow when the music hall is in use",
            "Content-shoot day: cohort dinners are doc gold",
        ],
    ),
    (
        "z08_practice_rooms",
        "WP-08",
        "Interconnected practice rooms with high ceilings and clean institutional "
        "lines, percussion gear and small drum kits in one corner, storage cupboards "
        "along one wall, adjustable lighting via tall windows with heavy curtains, "
        "scuffed parquet floor, cables on the floor, a foley closet visible through "
        "a doorway.",
        [
            "Editing room setups (2–3 stations per room)",
            "Sound mixing / Foley closet",
            "Color-grading review with controlled light (close windows + curtain)",
            "Breakouts when whole cohort splits into tracks",
        ],
    ),
    (
        "z10_storage_attic",
        "WP-10",
        "A dusty Palestinian institutional storage attic: stacked wooden bed frames "
        "and broken chairs, old binders and archive paper boxes labeled in Arabic, "
        "raw exposed brick and timber rafters, a single grimy window admitting "
        "shafts of dusty light, cobwebs in the corners.",
        [
            "Set-dressing inventory (real props — old wood, doors, archive paper)",
            "Texture / object photography drill",
            "Genre-set candidate: cellar / archive / detective scene",
        ],
    ),
    (
        "z11_outdoor_courtyard_garden",
        "WP-11",
        "A walled Palestinian stone compound: mature olive and pine trees providing "
        "dappled shade, dirt and gravel paths, a functional BBQ trough of weathered "
        "metal at the center, natural seating stones, a small stone outbuilding "
        "nestled in the trees, golden-hour warmth on the limestone walls.",
        [
            "Exterior camera-movement drills (steadicam, gimbal, dolly)",
            "Group photo + ID portraits under olive trees",
            "Communal cook-fire / shared meal (BBQ trough is operational)",
            "Outdoor circle for partner workshops (Circus School could drop in here)",
            "Plein-air scene shoots — natural light, full control",
        ],
    ),
]


def slugify(s: str, max_len: int = 40) -> str:
    """Normalize an activity string into a stable filename-safe slug."""
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s[:max_len].rstrip("_")


def short_zone_key(zone_id: str) -> str:
    """`z06_music_hall_grand_piano` → `z06`. Used by --zones filter."""
    return zone_id.split("_", 1)[0]


def build_prompt(scene_prompt: str, activity: str) -> str:
    return (
        f"Stylized game-asset illustration of a film bootcamp scene:\n"
        f"{activity}.\n\n"
        f"Setting: {scene_prompt}\n\n"
        f"{STYLE_BLOCK}"
    )


def plan() -> list[dict]:
    """Build the full set of (zone, activity, slug, output_path, prompt) entries."""
    items = []
    for zone_id, callsign, scene_prompt, activities in HERO_ZONES:
        for activity in activities:
            slug = slugify(activity)
            out_path = OUT_DIR / zone_id / f"{slug}.jpg"
            items.append({
                "zone_id": zone_id,
                "callsign": callsign,
                "activity_text": activity,
                "activity_slug": slug,
                "file": str(out_path.relative_to(OUT_DIR.parent.parent)),
                "abs_path": out_path,
                "prompt": build_prompt(scene_prompt, activity),
            })
    return items


def load_manifest() -> dict:
    if MANIFEST_PATH.exists():
        try:
            return json.loads(MANIFEST_PATH.read_text())
        except Exception:
            pass
    return {"schema_version": 1, "model": MODEL, "style": STYLE_TAG, "entries": []}


def save_manifest(manifest: dict) -> None:
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))


def upsert_manifest_entry(manifest: dict, item: dict, status: str) -> None:
    """Update or insert the manifest record for this (zone, activity_slug)."""
    entries = manifest.setdefault("entries", [])
    found = None
    for i, e in enumerate(entries):
        if e["zone_id"] == item["zone_id"] and e["activity_slug"] == item["activity_slug"]:
            found = i
            break
    record = {
        "zone_id": item["zone_id"],
        "callsign": item["callsign"],
        "activity_text": item["activity_text"],
        "activity_slug": item["activity_slug"],
        "file": item["file"],
        "model": MODEL,
        "style": STYLE_TAG,
        "status": status,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    if found is None:
        entries.append(record)
    else:
        entries[found] = record


def generate_one(client, item: dict, force: bool = False) -> tuple[str, str]:
    """Generate one image (with up to 3 attempts + exponential backoff)."""
    out = item["abs_path"]
    label = f"{item['zone_id']}/{item['activity_slug']}"
    if out.exists() and out.stat().st_size > 30_000 and not force:
        print(f"[skip] {label}")
        return label, "skipped"

    out.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(3):
        try:
            t0 = time.time()
            resp = client.models.generate_content(
                model=MODEL,
                contents=[item["prompt"]],
                config={"response_modalities": ["IMAGE"]},
            )
            for part in resp.candidates[0].content.parts:
                if part.inline_data is not None:
                    out.write_bytes(part.inline_data.data)
                    elapsed = time.time() - t0
                    size_kb = out.stat().st_size // 1024
                    print(f"[ok]   {label}  ({elapsed:.1f}s, {size_kb}KB)")
                    return label, "ok"
            print(f"[empty] {label} (no image in response, attempt {attempt+1})")
        except Exception as e:
            print(f"[err]  {label} attempt {attempt+1}: {e}")
            time.sleep(2 * (attempt + 1))
    return label, "failed"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--zones", default=None,
                        help="Comma-sep zone-id prefixes to include (e.g. z01,z06,z07). Default: all 7 hero zones.")
    parser.add_argument("--regen", default=None,
                        help="<zone_id>:<activity_slug> — force regenerate one image (zone_id may be the short prefix).")
    parser.add_argument("--execute", action="store_true",
                        help="Actually call the Gemini API. Without this flag, only the plan is printed.")
    parser.add_argument("--concurrency", type=int, default=4,
                        help="Max parallel API requests (default 4).")
    args = parser.parse_args()

    items = plan()

    # Filter by --zones
    if args.zones:
        wanted = {z.strip() for z in args.zones.split(",") if z.strip()}
        items = [it for it in items if short_zone_key(it["zone_id"]) in wanted or it["zone_id"] in wanted]

    # Filter by --regen
    force_set = set()
    if args.regen:
        zk, sk = args.regen.split(":", 1)
        items = [it for it in items
                 if (it["zone_id"] == zk or short_zone_key(it["zone_id"]) == zk)
                 and it["activity_slug"] == sk]
        force_set = {(it["zone_id"], it["activity_slug"]) for it in items}
        if not items:
            sys.exit(f"--regen target not found in plan: {args.regen}")

    if not items:
        sys.exit("nothing to do — check --zones filter")

    print(f"Model: {MODEL}")
    print(f"Style: {STYLE_TAG}")
    print(f"Plan: {len(items)} image(s) across {len({it['zone_id'] for it in items})} zone(s)")
    print(f"Output root: {OUT_DIR}")
    print()

    if not args.execute:
        print("DRY-RUN — no API calls. Pass --execute to generate. Plan:")
        for it in items:
            print(f"\n--- {it['callsign']} · {it['zone_id']} · {it['activity_slug']} ---")
            print(f"  file:   {it['file']}")
            print(f"  prompt: {it['prompt'][:200]}{'…' if len(it['prompt']) > 200 else ''}")
        return

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        sys.exit("missing GOOGLE_API_KEY / GEMINI_API_KEY in env")
    client = genai.Client(api_key=api_key)

    manifest = load_manifest()

    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as ex:
        futs = []
        for it in items:
            force = (it["zone_id"], it["activity_slug"]) in force_set
            futs.append(ex.submit(generate_one, client, it, force))
        for f in concurrent.futures.as_completed(futs):
            results.append(f.result())

    # Update manifest based on which images now exist on disk
    for it in items:
        if it["abs_path"].exists() and it["abs_path"].stat().st_size > 30_000:
            upsert_manifest_entry(manifest, it, "ok")
        else:
            upsert_manifest_entry(manifest, it, "missing")
    save_manifest(manifest)

    # Summary
    ok = sum(1 for _, s in results if s == "ok")
    skipped = sum(1 for _, s in results if s == "skipped")
    failed = sum(1 for _, s in results if s == "failed")
    print()
    print(f"Done. ok={ok}  skipped={skipped}  failed={failed}")
    print(f"Manifest: {MANIFEST_PATH}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
