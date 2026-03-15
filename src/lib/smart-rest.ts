// Smart rest timer defaults by exercise type
const COMPOUND_KEYWORDS = ['squat', 'deadlift', 'bench press', 'overhead press', 'ohp', 'barbell row', 'pull-up', 'pullup', 'chin-up', 'hip thrust', 'romanian deadlift', 'front squat'];
const ISOLATION_KEYWORDS = ['curl', 'extension', 'lateral raise', 'fly', 'flye', 'kickback', 'pullover', 'shrug', 'calf raise', 'face pull', 'rear delt'];

export function getSmartRestSeconds(exerciseName: string, rpe?: number | null): number {
  const name = exerciseName.toLowerCase();

  // Warm-up sets
  if (rpe !== null && rpe !== undefined && rpe < 6) return 45;

  // Check localStorage override
  const overrideKey = `rest-override-${name.replace(/\s+/g, '-')}`;
  const override = localStorage.getItem(overrideKey);
  if (override) return parseInt(override, 10);

  // Compound lifts: 3 minutes
  if (COMPOUND_KEYWORDS.some(k => name.includes(k))) return 180;

  // Isolation: 1:30
  if (ISOLATION_KEYWORDS.some(k => name.includes(k))) return 90;

  // Default
  return 120;
}

export function saveRestOverride(exerciseName: string, seconds: number) {
  const key = `rest-override-${exerciseName.toLowerCase().replace(/\s+/g, '-')}`;
  localStorage.setItem(key, seconds.toString());
}
