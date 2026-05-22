# Directions

This is a possibility space, not a roadmap. The August camp is the forcing function: by then, the project should be a tool participants and team open every day. How we get there is open.

The point of this doc is to give you context on where this could go, what's interesting about each path, and where the first useful questions live. Pick what catches your interest, push back on what doesn't, propose your own. Nothing here is locked.

## The shift

What we have: a polished **venue twin**. A scouting tool. People look at it before they come.

What August needs: an **in-camp app**. A tool people open while they're at the camp. Two user types, two surfaces.

**Participants** (15 to 25 campers, mobile first):
- See today's schedule and which zone they're at next
- Check in at a zone (QR at the door? geofence? simple tap?)
- Log creative output per zone: notes, photos, voice memos, sketches
- See what other participants are making (opt-in social layer)
- Personal progress: zones visited, activities completed, badges
- A portfolio they keep at the end

**Team** (Ameer + mentors + staff, desktop and mobile):
- Roster and daily schedule editor
- Live view of who is where, who is stuck
- Push announcements to a cohort
- Review and tag participant work
- Highlight reels for end-of-camp showcase

The current build covers ~10% of this surface (the map + shared notes part). The rest is open.

## The directions menu

Each direction below is a paragraph on what's interesting, plus the first useful question to answer. Some of these are independent, some compose, some are exclusive. Treat them as conversation starters with the codebase.

### Identity layer

Right now anyone with a URL can read and write notes in that workspace. That's fine for an internal scouting tool. For 25 campers logging their creative work, you want each person to be a distinct identity. Three honest options:

- **URL workspaces** (already half built via `?workspace=`). Each camper gets a personal URL. Friction-free, but weak identity. Hand the URLs out as printed cards on arrival day.
- **Magic link via email**. Cloudflare Workers can issue one-time tokens via Resend or similar. Real identity, no password. Onboarding is 60 seconds.
- **QR per participant on a lanyard**. Pre-generate a unique token per camper, print on a lanyard. Day-one scan in the app links the device to the identity. Tactile, hard to lose.

First question: do we want to know "who" the camper is (real name, email) or just "which" camper (anonymous-but-distinct)? Different answers point at different mechanisms.

### On-the-ground interactions

The current map is something you look at on a couch. The next move is something a camper interacts with on site:

- **QR codes at each zone door** (printed once before camp). Scan to check in. Cheap, no GPS hassle, works indoors.
- **Voice memos** via browser MediaRecorder. Most campers think out loud; let them. Upload to Cloudflare R2 (free tier covers this scale).
- **Photo upload per task** with an opt-in feed. The bootcamp is a film camp. People will take photos. Capture them where the work happened.
- **"What I made here"** mini portfolios per zone, auto-assembled from the camper's photos + voice memos + notes.

First question: what's the smallest interaction that proves "the app got used at the venue"? Build that first, then layer.

### Team awareness

The team needs to know what's happening without having to ask. Mentors should be able to see who's where and step in when something's stuck:

- **Live participant pins on the map** (the simulation already supports note pins; participant pins are the same shape with different data).
- **Pulse view**: heatmap of where the cohort is right now. One screen on a TV in the team room.
- **Mentor office-hours toggle**: mentors mark which zones they're hanging out in, campers see them.

First question: what's the cheapest signal that says "this camper is at this zone"? (Last seen, last check-in, last note?) That signal drives everything else.

### Gamification, gently

Bootcamps aren't homework. Don't ship a leaderboard. But the right small loops keep people moving:

- Visited-X-zones badges
- Cohort-wide progress meter ("the group is 40% through Track A")
- A shared wall of best photos and notes (curated by team, not auto-ranked)

First question: which behavior do we want to reinforce? Visiting more zones? Engaging deeper at fewer? The answer changes what to reward.

### August readiness polish

These are concrete improvements that don't require new product thinking:

- **Mobile-first redesign**. The current sim shows 7 of 18 stations on a 390 px viewport. Pinch-zoom works but isn't enough.
- **PWA install** ("Add to Home Screen"). Acts like a real app on the camper's phone. Free win.
- **Offline first**. The venue's wifi is unknown. Cache aggressively, sync when online.
- **Bilingual UI toggle** (EN ↔ AR). Not just bilingual data, the UI chrome too. Match the rest of KAWADER's materials.

First question: which of these unlock the rest? (PWA install is probably the gate. Without it, this is "a website I keep open in a tab".)

### The portfolio outcome

A camp produces work. The app should be the place that work ends up:

- **Per-participant portfolio export** at end of camp. Markdown? PDF? A static site?
- **Public showcase** assembled from team-tagged highlights.
- **Year-in-review** PDF per participant (zones visited, work made, mentors interacted with).

First question: who's the audience for the portfolio? The camper themselves (memory)? Future employers / film schools? Family? Each audience wants a different output.

### Beyond the camp

Some directions reach past August:

- A **2027 cohort** spin-off (the project structure already supports this; the data layer just needs a year scope).
- A **public-facing site** for KAWADER's bootcamp brand: applications, alumni, showcase.
- **Templates for other venues**. The "venue twin + camp app" idea applies to any program. Could become a KAWADER product.

These are long-tail. Mention them so the trainee can keep them in peripheral vision.

## How to bring an idea forward

If something here clicks, or you have a different idea entirely:

1. Sketch the smallest version that you could ship in a week.
2. Drop it in a `proposals/<short-name>.md` in this repo or write it as a Notion comment.
3. Send Ameer a link. Most decisions can be made async.

The pace question matters. Bootcamp is in August. Anything that has a chance of being in campers' hands by then is gold. Anything past August is interesting but not urgent.

## What we're NOT doing

A few directions that look obvious but aren't:

- **Switching to React / Next.js / any framework**. The build-step-free constraint is a feature. Talk to Ameer if you think it's blocking something real.
- **Building our own auth from scratch**. Use Cloudflare Access, magic links, or URL workspaces. We're a small team and auth is a tar pit.
- **Adding a database (Postgres, Supabase, etc.)**. Cloudflare KV is enough for this scale. The day we outgrow it, we'll know.
- **Generating mockups for the 11 discovery zones**. They're light by design. See `gotchas.md` §3.

## A note on tone

The trainee picking this up has agency. Push back on things in this doc that don't make sense. Ameer would rather you bring "actually here's what I think we should do" than ask for permission on each step. If something in the directions menu feels wrong, say so.
