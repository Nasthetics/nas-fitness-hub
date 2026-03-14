

# Nas Fitness OS - Full Feature Expansion

This is a large expansion covering 9 feature areas. Here is the implementation plan broken into phases.

---

## Database Changes Required

### New Tables

| Table | Purpose |
|-------|---------|
| `recovery_checkins` | Daily recovery check-in data (sleep, energy, stress, breathwork, score) |
| `periodization_plans` | Mesocycle tracking (phase, start date, week number) |

### Schema Modifications

| Table | Change |
|-------|--------|
| `set_logs` | Add `rir` integer column (Reps In Reserve) |
| `profiles` | Add `height_cm`, `body_fat_percent`, `lean_mass_kg`, `target_weight_gain_per_week`, `water_target_ml`, `ramadan_mode` columns |

### Pre-loaded Data (via insert tool)

- 14 supplements with correct timings (Ashwagandha, Opti-Men, Vit C, etc.)
- Profile defaults: 95kg, 190cm, 14% BF, 81.7kg lean mass, 2556 kcal, 245.5g P, 189g C, 90.6g F

---

## New Pages & Routes

| Route | Page | Feature |
|-------|------|---------|
| `/recovery` | Recovery.tsx | Daily 10-second check-in + recovery score + 7-day trend |
| `/periodization` | Periodization.tsx | Mesocycle planner with phase progress bar |
| `/settings` | Settings.tsx | Profile editor + Ramadan mode toggle |
| `/reports` | Reports.tsx | Monthly performance report with export |

---

## Feature Breakdown

### 1. Supplement Timeline (Enhance existing Supplements page)
- Regroup into Morning / During Workout / Post-Workout / With Meal / Evening / Pre-Sleep sections
- Add RED warning badge for Metformin: "WITH MEALS ONLY - never fasted"
- Add weekly adherence % calculation (query last 7 days of logs)
- Add streak counter per supplement

### 2. Adaptive Macro Engine (Add to Nutrition page)
- Weekly weigh-in card showing 7-day average weight
- Compare to previous week's average
- Auto-suggest calorie adjustment: >0.5kg/week = -150kcal, <0.2kg/week = +150kcal
- Target: +0.3kg/week clean bulk indicator

### 3. Plate Calculator (Add to Workouts page)
- Input field for target weight (kg)
- Pure frontend calculation based on 20kg Olympic bar
- Available plates: 25, 20, 15, 10, 5, 2.5, 1.25 kg
- Show visual plate diagram per side

### 4. RPE + RIR Logging (Enhance QuickSetInput)
- Add RPE slider (1-10) and RIR dropdown (0-5) to each set row
- RPE already exists in `set_logs`, just need to add RIR column and UI

### 5. Periodization Planner (New page)
- Display current mesocycle: Hypertrophy (W1-6), Strength (W7-10), Deload (W11), Test (W12)
- Progress bar showing current week within phase
- Phase-specific set/rep recommendations
- Auto-suggest deload if average RPE >8 for 2 consecutive weeks (computed from set_logs)

### 6. Recovery Screen (New page)
- Quick check-in form: sleep hours, sleep quality (1-5), energy (1-5), stress (1-5), breathwork (yes/no)
- Recovery Score formula: weighted average mapped to 0-100
- Color-coded recommendation badge (Push Hard / Normal / Reduce Volume / Active Recovery)
- 7-day trend line chart

### 7. Body Progress (Enhance existing Progress page)
- Weekly weigh-in card with lean mass vs fat mass breakdown
- Bulk Quality Score (% of gain that is lean mass, green if >70%)
- Alert banner if BF% trending above 16%
- 12-month projection line based on current weekly rate

### 8. Ramadan Mode (Settings page)
- Toggle switch stored in profiles
- When ON: show hardcoded Dubai prayer times
- Shift supplement timings display (Metformin to Iftar/Suhoor, Magnesium to Suhoor, Creatine to post-Iftar)
- Workout timing options (Pre-Iftar light, Post-Iftar performance, Post-Tarawih)
- Hydration tracker: 4L between Iftar-Suhoor with interval reminders

### 9. Monthly Performance Report (New page)
- Computed from existing data: top PRs, strength deltas, volume progression, macro adherence %, supplement consistency %, body comp
- Render as a styled card
- Export as image using html2canvas

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Recovery.tsx` | Recovery check-in screen |
| `src/pages/Periodization.tsx` | Mesocycle planner |
| `src/pages/Settings.tsx` | Profile + Ramadan mode settings |
| `src/pages/Reports.tsx` | Monthly performance report |
| `src/components/workouts/PlateCalculator.tsx` | Plate calculator dialog |
| `src/components/nutrition/AdaptiveMacroCard.tsx` | Weekly weight trend + calorie suggestions |
| `src/components/progress/BulkQualityCard.tsx` | Lean mass tracking + quality score |
| `src/components/supplements/SupplementWarningBadge.tsx` | Red Metformin warning badge |
| `src/components/recovery/RecoveryCheckin.tsx` | Quick check-in form |
| `src/components/recovery/RecoveryScoreCard.tsx` | Score display + recommendation |
| `src/components/settings/RamadanMode.tsx` | Ramadan toggle + prayer times |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add 4 new routes |
| `src/components/layout/AppSidebar.tsx` | Add nav items (Recovery, Periodization, Settings, Reports) |
| `src/pages/Supplements.tsx` | Add timeline grouping, warning badges, streak/adherence |
| `src/pages/Nutrition.tsx` | Add AdaptiveMacroCard component |
| `src/pages/Progress.tsx` | Add bulk quality score, BF% alert, projection |
| `src/pages/Workouts.tsx` | Add PlateCalculator button |
| `src/components/workouts/QuickSetInput.tsx` | Add RPE slider + RIR field |
| `src/components/workouts/EnhancedExerciseCard.tsx` | Pass RPE/RIR through |
| `src/hooks/use-fitness-data.ts` | Add hooks for recovery, periodization, weekly weight averages |
| `src/lib/types.ts` | Add new types (RecoveryCheckin, PeriodizationPlan, etc.) |

---

## Implementation Priority

1. **Database migrations** - New tables + column additions
2. **Pre-load data** - 14 supplements + profile defaults
3. **RPE/RIR** - Quick win, small UI change
4. **Plate Calculator** - Pure frontend, no DB
5. **Supplement Timeline** - Enhance existing page
6. **Recovery Screen** - New page + table
7. **Adaptive Macro Engine** - Computed from existing data
8. **Body Progress** - Enhance existing page
9. **Periodization Planner** - New page
10. **Settings + Ramadan Mode** - New page
11. **Monthly Report** - Computed, last since it aggregates everything
12. **Sidebar + Routes** - Wire everything together

