# Handoff · Bootcamp Application — Wizard / Dark / Bilingual

> **For:** the next Claude Code session.
> **From:** session ending 2026-05-14 ~14:00.
> **Status:** plan approved by user (Ameer). Ready to execute.
> **Full plan (read once before coding):** `~/.claude/plans/remove-the-rooms-from-humble-creek.md`

---

## Goal

Rewrite the bootcamp application page at `frontend/src/components/bootcamp/Application.tsx` to be:
1. **Dark themed** (Kawader Cine-Rentals brand: Midnight Navy + Royal Purple + Soft Lilac + Warm Yellow).
2. **Multi-step wizard** — 3 steps with per-step validation.
3. **Fully bilingual EN ⇄ AR** with a top-bar toggle that flips `<html dir>` to RTL.
4. **No 18-room picker.** Drop it entirely.
5. **Intro hero** explaining what the camp is (manifesto tone, sourced from Notion).

When you're done, the page should feel like Kawader, read true to the camp's actual concept, and be honest about what's still TBD.

---

## FACTS — DO NOT DRIFT

These are the only sourced facts about the camp. Anything not in this table is **NOT KNOWN** and must render as a `[TBD: …]` bracket placeholder in the UI.

| Fact | Value | Source |
|---|---|---|
| Project name | **KAWADER Film Camp 2026** | Notion `337ce6a70d69806fb86efbe65608c1a3` |
| Status | Planning | Notion project page |
| Team | Ameer, Mariam, Motaz, Azouz, Baha | Notion project + kickoff |
| Organizer | Kawader Art Productions & Film Services | Notion brief |
| Duration | **4 days / 3 nights or 5 days / 4 nights** (TBD) | Notion brief · "Format" |
| Participants | **~50 target, split into ~5 teams** (≈10 per team) | Notion brief + kickoff |
| Dates | **`[August 2026 — exact dates TBD]`** | Notion brief + STATUS.md |
| Venue — primary | Jabal Al-Najmeh / Star Mountain | Notion brief (primary) |
| Venue — backup | Edward Said Cultural Institute, Birzeit | Notion brief (backup) — scout was here 2026-05-11 |
| **Venue in copy** | **NEVER NAMED DIRECTLY** | User explicit instruction this session |
| Daily flow | Morning micro-workshops · Afternoon cinema games · Evening rushes + campfire debriefs | Notion kickoff "Daily Architecture" |
| In-camp focus | Pre-production + production. Post-prod → follow-up workshops. | Notion "Locked Decisions" |
| Theatre tools | Breathing · senses · movement (daily self-improvement block) | Notion kickoff |
| Departments | Camera ×4 / Production ×4 / Sound ×4 (small unbalanced teams) | Notion kickoff |
| Brand voice | "Founded by filmmakers, for filmmakers." | `brand/identity.md` |
| Arabic register | **MSA (الفصحى)** — formal recruitment surface | `feedback_formal-docs-msa.md` |

### What this camp is NOT (verbatim from Notion — the "negative" tone source)
- Not a lecture series — every day has hands-on execution.
- Not individual work — team-based with role accountability.
- Not a post-production bootcamp — editing depth lives in follow-up workshops.
- Not preference-driven — venue, schedule, and staffing decisions are readiness-based.

### Do NOT invent
- Exact dates, final price, final venue choice, age/experience brackets, application materials list, deadline, faculty roster.
- "15 filmmakers" (was fabricated in earlier drafts — correct is **~50, split into 5 teams**).
- "Two weeks" (correct is **4 days**).
- "18 rooms" (the picker is gone; don't allude to it).
- "Edward Said" / "Jabal Al-Najmeh" / "Birzeit" / "Star Mountain" — never in UI copy.

---

## `[TBD]` bracket convention

For any unknown fact, render it visibly as `[TBD: short label]` in the actual UI. The user wants to see what's still pending so they can fill it in. Do **not** invent values.

Example:
- Hero: `Application open · August 2026 · [Dates TBD]`
- AR: `التقديم مفتوح · آب ٢٠٢٦ · [التواريخ قيد التأكيد]`

---

## Locked intro copy (verbatim — do NOT rewrite)

User chose "Direction C · Manifesto, earned" this session after rejecting three other drafts. The text below is the user-approved version.

### English
> **This is not a film school. It's four days inside the work.**
>
> Small teams. Tight constraints. Real outputs every night.
>
> Mornings build the craft. Afternoons stress-test it. Evenings put it on a screen.
>
> From filmmakers, for filmmakers.

### العربية (MSA)
> **هذا ليس مدرسةَ سينما. إنّه أربعةُ أيّامٍ داخلَ العمل.**
>
> فِرَقٌ صغيرة. قيودٌ ضيّقة. أعمالٌ حقيقيّةٌ كلَّ ليلة.
>
> صباحاتٌ تَبني الحِرفة. ظهيراتٌ تَختبرُها. أمسياتٌ تَعرضُها على الشاشة.
>
> من صنّاعِ الأفلام، لصنّاعِ الأفلام.

### Composition (UI placement)
- **Hero overlay** = paragraph 1, split across 2 lines:
  - Line 1 (lilac `#a77fb2`): "This is not a film school." / "هذا ليس مدرسةَ سينما."
  - Line 2 (white): "It's four days inside the work." / "إنّه أربعةُ أيّامٍ داخلَ العمل."
  - Type: Orbitron 700 (EN) · Tajawal 700 (AR). Large — `text-5xl` / `text-6xl` range.
- **Intro block** below the painted venue = paragraphs 2–4:
  - Paragraph 2 punchy (large Inter or small Orbitron caps).
  - Paragraph 3 in Inter body.
  - Paragraph 4 in Inter italic, brand-purple `#8f43a3`.

---

## Full UI string map

Create `frontend/src/components/bootcamp/i18n.ts` exporting:

```ts
export const strings = {
  nav: {
    brand:      { en: 'Kawader · Film Camp',  ar: 'كوادر · معسكر السينما' },
    cohort:     { en: 'Cohort 01 · 2026',     ar: 'الدفعة الأولى · ٢٠٢٦' },
    langToggle: { en: 'العربية', ar: 'English' },   // shows the OTHER language
  },
  hero: {
    eyebrow:   { en: 'Kawader · Film Camp · Cohort 01',
                 ar: 'كوادر · معسكر السينما · الدفعة الأولى' },
    openTag:   { en: 'Application open · August 2026 · [Dates TBD]',
                 ar: 'التقديم مفتوح · آب ٢٠٢٦ · [التواريخ قيد التأكيد]' },
    headline1: { en: 'This is not a film school.',
                 ar: 'هذا ليس مدرسةَ سينما.' },
    headline2: { en: 'It’s four days inside the work.',
                 ar: 'إنّه أربعةُ أيّامٍ داخلَ العمل.' },
    metaVenue: { en: 'An authentic location · West Bank',
                 ar: 'موقعٌ أصيل · الضفّة الغربيّة' },
    introLine1: { en: 'Small teams. Tight constraints. Real outputs every night.',
                  ar: 'فِرَقٌ صغيرة. قيودٌ ضيّقة. أعمالٌ حقيقيّةٌ كلَّ ليلة.' },
    introLine2: { en: 'Mornings build the craft. Afternoons stress-test it. Evenings put it on a screen.',
                  ar: 'صباحاتٌ تَبني الحِرفة. ظهيراتٌ تَختبرُها. أمسياتٌ تَعرضُها على الشاشة.' },
    introLine3: { en: 'From filmmakers, for filmmakers.',
                  ar: 'من صنّاعِ الأفلام، لصنّاعِ الأفلام.' },
    begin:     { en: 'Begin application →', ar: 'ابدأ التقديم ←' },
  },
  wizard: {
    stepLabels: {
      details:   { en: 'Your details',     ar: 'معلوماتك' },
      statement: { en: 'Your statement',   ar: 'بيانك' },
      review:    { en: 'Review & submit',  ar: 'المراجعة والإرسال' },
    },
    of:         { en: 'of',          ar: 'من' },
    step:       { en: 'Step',        ar: 'الخطوة' },
    back:       { en: 'Back',        ar: 'السابق' },
    continue:   { en: 'Continue',    ar: 'متابعة' },
    submit:     { en: 'Submit application', ar: 'إرسال التقديم' },
    submitting: { en: 'Sending…',    ar: 'جارٍ الإرسال…' },
  },
  fields: {
    fullName:  { label: { en: 'Full name', ar: 'الاسم الكامل' },
                 placeholder: { en: 'Layla Khoury', ar: 'ليلى خوري' } },
    email:     { label: { en: 'Email', ar: 'البريد الإلكتروني' },
                 placeholder: { en: 'you@example.com', ar: 'you@example.com' } },
    phone:     { label: { en: 'Phone / WhatsApp', ar: 'الهاتف / واتساب' },
                 hint:  { en: 'Best number to reach you.', ar: 'أفضل رقم للتواصل معك.' },
                 placeholder: { en: '+970 599 ___ ___', ar: '+970 599 ___ ___' } },
    statement: { label: { en: 'Why this camp', ar: 'لماذا هذا المعسكر؟' },
                 hint:  { en: 'A paragraph or two, in your voice.',
                          ar: 'فقرةٌ أو فقرتان، بصوتك.' },
                 placeholder: { en: 'A short film I saw last year cracked something open in me…',
                                ar: 'فيلمٌ قصيرٌ شاهدتُه العامَ الماضي فتحَ في داخلي شيئًا…' },
                 counter: { en: '/ 800', ar: '/ ٨٠٠' } },
    consent:   { label: { en: 'You may write to me about this application.',
                          ar: 'يمكنكم التواصل معي بخصوص هذا الطلب.' } },
  },
  errors: {
    nameRequired:    { en: 'Please enter your full name', ar: 'الرجاء إدخال الاسم الكامل' },
    emailInvalid:    { en: 'That doesn’t look like a valid email',
                       ar: 'يبدو أنّ البريد الإلكتروني غير صحيح' },
    phoneShort:      { en: 'Phone too short', ar: 'رقم الهاتف قصير جدًا' },
    phoneInvalid:    { en: 'Digits, spaces, +, –, () only',
                       ar: 'الأرقام والمسافات والرموز + – ( ) فقط' },
    statementMin:    { en: 'At least 40 characters', ar: 'لا يقلّ عن ٤٠ حرفًا' },
    statementMax:    { en: 'Under 800 characters', ar: 'يجب ألّا يتجاوز ٨٠٠ حرف' },
    consentRequired: { en: 'Required to continue', ar: 'مطلوب للمتابعة' },
  },
  review: {
    title: { en: 'Looks right?', ar: 'هل المعلومات صحيحة؟' },
    sub:   { en: 'Make sure everything reads true before submitting.',
             ar: 'تأكّدوا من صحّة المعلومات قبل الإرسال.' },
    edit:  { en: 'Edit', ar: 'تعديل' },
    fieldName:      { en: 'Name', ar: 'الاسم' },
    fieldEmail:     { en: 'Email', ar: 'البريد الإلكتروني' },
    fieldPhone:     { en: 'Phone', ar: 'الهاتف' },
    fieldStatement: { en: 'Statement', ar: 'البيان' },
  },
  done: {
    received: { en: 'Received', ar: 'تمّ الاستلام' },
    welcome:  { en: 'Welcome,', ar: 'أهلاً،' },
    body: {
      en: 'A small panel of us will read this and write back to {email} within 48 hours.',
      ar: 'سيقرأ طلبكم فريقٌ صغيرٌ منّا، وسنردّ على {email} خلال ٤٨ ساعة.',
    },
  },
  footer: {
    panel: { en: 'Read by a small panel · replies within 48 hours',
             ar: 'يقرأها فريقٌ صغير · الردود خلال ٤٨ ساعة' },
    brand: { en: 'Kawader Art Productions & Film Services · kawader-cine.com',
             ar: 'كوادر للإنتاج الفنّي وخدمات الأفلام · kawader-cine.com' },
  },
} as const

export type Lang = 'en' | 'ar'
```

Also export a `useLang()` hook returning `{ lang, setLang, t, dir }` where:
- `t(key)` reads from `strings` for the current `lang`. Use dot-path keys: `t('hero.headline1')`.
- `dir = lang === 'ar' ? 'rtl' : 'ltr'`.

---

## Language provider

Create `frontend/src/components/bootcamp/LanguageProvider.tsx`:

- React context exposing `lang` + `setLang`.
- Initial value: `localStorage.getItem('kw-lang')` if valid, else `'en'`.
- On `setLang`:
  - Update state
  - `document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'`
  - `document.documentElement.lang = lang`
  - `localStorage.setItem('kw-lang', lang)`
- Mount-time `useEffect` syncs `<html dir>` + `<html lang>` to the initial value.

---

## Dark theme tokens

Modify `frontend/src/index.css`. In the existing `@theme` block, replace/add:

```css
--color-kw-bg:           #000011;
--color-kw-bg-elev:      #0a0a18;
--color-kw-input-bg:     rgba(255,255,255,0.04);
--color-kw-border:       rgba(255,255,255,0.10);
--color-kw-border-focus: rgba(167,127,178,0.60);
--color-kw-text:         #f5f3ef;
--color-kw-text-soft:    rgba(245,243,239,0.65);
--color-kw-text-mute:    rgba(245,243,239,0.40);
--color-kw-purple:       #8f43a3;
--color-kw-purple-deep:  #6d2f80;
--color-kw-lilac:        #a77fb2;
--color-kw-yellow:       #ffd700;
--color-kw-error:        #ff8c5e;
```

Set `body` background to `var(--color-kw-bg)` and default text to `var(--color-kw-text)`. RTL arrow flip:

```css
[dir="rtl"] .arrow-flip { transform: scaleX(-1); }
```

---

## File changes

| File | Action | Notes |
|---|---|---|
| `frontend/src/components/bootcamp/i18n.ts` | **CREATE** | String map + `useLang()` hook (above) |
| `frontend/src/components/bootcamp/LanguageProvider.tsx` | **CREATE** | Context + localStorage + `<html dir>` (above) |
| `frontend/src/components/bootcamp/Application.tsx` | **REWRITE** | Dark + wizard + bilingual (target structure below) |
| `frontend/src/components/bootcamp/shared.ts` | **MODIFY** | Drop `zones`, `Zone`, `zonePhotos`. Drop `zones` field from schema. Keep `campMeta`. Schema fields: `fullName`, `email`, `phone`, `statement`, `consent`. |
| `frontend/src/index.css` | **MODIFY** | Add dark token block (above). Body bg → `--color-kw-bg`. |
| `frontend/src/App.tsx` | **MODIFY** | Wrap `<Application />` in `<LanguageProvider>`. `<Toaster theme="dark" />`. |
| `frontend/public/camp-photos/` | **KEEP** unreferenced. Don't delete (might be used later). |

---

## Application.tsx target structure

```
<LanguageProvider>
  <Page bg="kw-bg" text="kw-text">

    <TopBar>
      <Brand: K mark + t('nav.brand') (Orbitron · Tajawal in AR)>
      <Right: t('nav.cohort') + <LangToggle> (clicking toggles + shows the OTHER language)>
    </TopBar>

    <Hero>                          {/* not a wizard step */}
      <PaintedVenueImage src="/painted-venue.webp" /> {/* dark vignette + brand-purple multiply tint */}
      <Overlay top-right (kw-yellow text):
        t('hero.eyebrow')
        t('hero.openTag')                            // includes "[Dates TBD]"
      />
      <Overlay bottom (large headline):
        Line 1 in lilac: t('hero.headline1')
        Line 2 in white: t('hero.headline2')
      />
      <Meta strip below hero: t('hero.metaVenue')   // "An authentic location · West Bank"
    </Hero>

    <IntroBlock>                    {/* manifesto paragraphs 2–4 */}
      <p large punchy>{t('hero.introLine1')}</p>
      <p body>{t('hero.introLine2')}</p>
      <p italic purple>{t('hero.introLine3')}</p>
      <BeginButton onClick={scrollToWizard}>{t('hero.begin')}</BeginButton>
    </IntroBlock>

    <Wizard id="wizard">
      <StepIndicator>
        3 segments: current = purple fill, completed = lilac, future = muted
        Above: "Step {n} of 3 · {label}"  in Orbitron caps EN, Tajawal AR
      </StepIndicator>

      <AnimatePresence mode="wait">
        {step === 0 && <StepDetails />}    {/* fullName, email, phone */}
        {step === 1 && <StepStatement />}  {/* textarea + counter */}
        {step === 2 && <StepReview />}     {/* read-only summary + consent + submit */}
      </AnimatePresence>

      <WizardNav>
        <BackButton hidden={step === 0} className="arrow-flip">
          ← {t('wizard.back')}
        </BackButton>
        <ContinueButton onClick={onNext} className="arrow-flip">
          {step === 2 ? t('wizard.submit') : t('wizard.continue')} →
        </ContinueButton>
      </WizardNav>
    </Wizard>

    {submitted && <Confirmation data={submitted} />}   {/* replaces the wizard */}

    <Footer>
      <p muted>{t('footer.panel')}</p>
      <p muted>{t('footer.brand')}</p>
    </Footer>

  </Page>
</LanguageProvider>
```

### Per-step validation

```ts
const stepFields: Record<number, (keyof FormValues)[]> = {
  0: ['fullName', 'email', 'phone'],
  1: ['statement'],
  2: ['consent'],
}
async function onNext() {
  const valid = await form.trigger(stepFields[step])
  if (!valid) return
  if (step < 2) setStep(step + 1)
  else form.handleSubmit(onSubmit)()
}
```

### RTL handling

- `<html dir>` flip is the primary mechanism — Tailwind's `start-*` / `end-*` logical properties handle most layout; for hand-positioned absolute overlays, swap `left-*` for logical `start-*`.
- Arrow icons on Back/Continue use class `arrow-flip` which is `[dir="rtl"] { transform: scaleX(-1); }`.
- `dir="rtl"` on the Arabic toggle string isn't necessary since the toggle shows the OTHER language (always different script).

---

## Verification

1. **Build clean:** `cd frontend && npm run build` — no TS errors, no CSS warnings.
2. **Dev server:** `npm run dev` at http://localhost:5173. Open in browser, test both languages.
3. **Playwright captures** — write or extend `shoot-app.mjs` to snap:
   - `/tmp/hero-en.png` — hero + intro + step 1 form (EN)
   - `/tmp/hero-ar.png` — same page after AR toggle (RTL flipped)
   - `/tmp/step2-statement.png`
   - `/tmp/step3-review.png` — all entered data shown
   - `/tmp/confirmation.png` — after submit
   - `/tmp/validation-errors.png` — submit empty step 1 (errors visible)
4. **Manual checks:**
   - Toggle EN ⇄ AR: `<html dir>` and `<html lang>` update via DOM inspector.
   - Reload after AR: page comes back in AR.
   - Per-step validation: cannot move from step 0 to step 1 with empty fields.
   - Submit on step 2: confirmation card appears + Sonner toast fires.
   - All error messages render in current language.

---

## Acceptance checklist (executor confirms before declaring done)

- [ ] EN/AR toggle works, persists across reload, flips `<html dir>` to RTL.
- [ ] All 3 wizard steps validate independently (cannot skip empty step).
- [ ] Painted venue (`/painted-venue.webp`) is the hero image with brand-purple multiply tint.
- [ ] Orbitron + Tajawal + Inter all loading; Orbitron used for EN headlines, Tajawal for AR headlines.
- [ ] No reference to "Edward Said" / "Birzeit" / "Jabal Al-Najmeh" / "Star Mountain" / 18-room picker / raw scout photos / "15 filmmakers" / "two weeks" anywhere in the rendered UI.
- [ ] `[Dates TBD]` bracket visible in the hero openTag in both languages.
- [ ] Intro copy renders verbatim — no rewriting.

---

## Critical files (read once, in this order)

1. **This handoff** (you're here).
2. `~/.claude/plans/remove-the-rooms-from-humble-creek.md` — full plan with rationale; refer if anything in this handoff is unclear.
3. `frontend/src/components/bootcamp/Application.tsx` — current state (will be rewritten).
4. `frontend/src/components/bootcamp/shared.ts` — schema + campMeta (will be trimmed).
5. `frontend/src/index.css` — current `@theme` block (will be extended).
6. `frontend/src/App.tsx` — root component (will wrap in `LanguageProvider`).
7. `frontend/public/painted-venue.webp` — hero asset. **DO NOT label with a venue name.** It's a painting of Edward Said (the backup venue per Notion) but functions as a generic "authentic location" in this design.
8. `~/.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_formal-docs-msa.md` — Arabic register rule.
9. `~/.claude/projects/-Users-Kawader-KAWASIST/memory/feedback_venue-naming-edward-said.md` — venue naming rule (relevant only as a safety check against the "Dar Al-Saeed" misspelling; don't use the venue name at all in this surface).

---

## Reusable utilities already wired

- `cn()` from `@/lib/utils` — class merging.
- `react-hook-form` + `@hookform/resolvers/zod` — already installed.
- `motion` + `AnimatePresence` from `motion/react` — already installed; use `mode="wait"` between step keys.
- `Sonner` + `toast` — already installed.
- shadcn `Input`, `Textarea`, `Checkbox` — already at `@/components/ui/`. Style with dark tokens (override `bg`, `border` per token list).

---

## Notes — do NOT

- Invent a separate bootcamp brand. It inherits Cine-Rentals (Royal Purple + Midnight Navy + Orbitron + Tajawal).
- Add particle effects, gradient blobs, film grain, Ken Burns, Polaroids — earlier rounds proved noise without value.
- Reference "Dar Al-Saeed" or spelling "Saeed" anywhere — if you must mention the venue (you shouldn't), it's "Edward Said".
- Name the venue ("Edward Said", "Jabal Al-Najmeh", "Birzeit", "Star Mountain") anywhere in the application UI.
- Invent any of the camp's daily activities beyond what's in the FACTS block. "Cinema games" and "rushes" are Notion-sourced and approved.
- Reference "2 weeks", "15 filmmakers", "18 rooms", or scout photos.
- Wire submission to Notion/Gmail yet — keep the current mock 800 ms delay + Sonner toast. That wiring is a separate phase.

---

## When done

1. Run `npm run build` to confirm a clean prod build.
2. Run the Playwright capture script and review all six screenshots.
3. Append a short row to `STATUS.md` under "Current Focus" describing what shipped:
   > 🟢 BOOTCAMP APPLICATION v3 — dark wizard, bilingual EN/AR, manifesto intro (YYYY-MM-DD HH:MM)
4. If anything in this handoff was wrong or had to be adapted, append a note to the bottom of `~/.claude/plans/remove-the-rooms-from-humble-creek.md` under a new "Execution notes" section so the user can review the delta.
5. Open the dev server in the user's browser at http://localhost:5173 so they can see the result immediately.

---

## What was learned this session (for memory)

The user pushed back hard on three patterns I should not repeat:

1. **Stop inventing facts** — multiple times this session I asserted "15 filmmakers" / "two weeks" / "Edward Said as primary venue" without sourcing. The Notion project page is the authoritative brief; check it BEFORE drafting copy.
2. **Don't decorate** — Polaroids, film grain, Ken Burns, gradient blobs, big numerals all got cut. Discipline > flourish. The brand is grounded, not flashy.
3. **Copy is iterated, not generated** — three drafts of the intro got rejected before "Direction C · Manifesto, earned" landed. Offer options before assuming a register; the user will pick.
