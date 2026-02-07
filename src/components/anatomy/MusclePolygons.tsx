// SVG path data for each muscle group - anatomically accurate bodybuilder physique
// Front view muscle paths
export const FRONT_MUSCLES = {
  chest: {
    id: 'chest',
    name: 'Chest',
    path: 'M 85 95 Q 100 85 115 95 L 120 115 Q 100 125 80 115 Z M 80 115 Q 72 105 75 95 L 85 95 Z M 115 95 Q 128 105 125 115 L 120 115 Z',
    center: { x: 100, y: 105 },
  },
  shoulders_left: {
    id: 'shoulders',
    name: 'Shoulders',
    path: 'M 60 85 Q 55 95 58 108 L 72 105 Q 72 92 75 85 Q 68 82 60 85 Z',
    center: { x: 65, y: 95 },
  },
  shoulders_right: {
    id: 'shoulders',
    name: 'Shoulders',
    path: 'M 140 85 Q 145 95 142 108 L 128 105 Q 128 92 125 85 Q 132 82 140 85 Z',
    center: { x: 135, y: 95 },
  },
  biceps_left: {
    id: 'biceps',
    name: 'Biceps',
    path: 'M 55 110 Q 50 125 52 145 L 62 148 Q 65 130 63 112 L 55 110 Z',
    center: { x: 58, y: 128 },
  },
  biceps_right: {
    id: 'biceps',
    name: 'Biceps',
    path: 'M 145 110 Q 150 125 148 145 L 138 148 Q 135 130 137 112 L 145 110 Z',
    center: { x: 142, y: 128 },
  },
  forearms_left: {
    id: 'forearms',
    name: 'Forearms',
    path: 'M 50 148 Q 45 165 48 185 L 58 185 Q 60 165 58 150 L 50 148 Z',
    center: { x: 54, y: 166 },
  },
  forearms_right: {
    id: 'forearms',
    name: 'Forearms',
    path: 'M 150 148 Q 155 165 152 185 L 142 185 Q 140 165 142 150 L 150 148 Z',
    center: { x: 146, y: 166 },
  },
  core: {
    id: 'core',
    name: 'Core',
    path: 'M 82 125 L 118 125 L 118 175 Q 100 180 82 175 Z',
    center: { x: 100, y: 150 },
  },
  quadriceps_left: {
    id: 'quadriceps',
    name: 'Quadriceps',
    path: 'M 75 180 Q 70 210 72 245 L 88 248 Q 92 215 88 182 L 75 180 Z',
    center: { x: 80, y: 214 },
  },
  quadriceps_right: {
    id: 'quadriceps',
    name: 'Quadriceps',
    path: 'M 125 180 Q 130 210 128 245 L 112 248 Q 108 215 112 182 L 125 180 Z',
    center: { x: 120, y: 214 },
  },
  calves_left: {
    id: 'calves',
    name: 'Calves',
    path: 'M 72 255 Q 68 280 70 310 L 82 312 Q 85 282 82 255 L 72 255 Z',
    center: { x: 76, y: 283 },
  },
  calves_right: {
    id: 'calves',
    name: 'Calves',
    path: 'M 128 255 Q 132 280 130 310 L 118 312 Q 115 282 118 255 L 128 255 Z',
    center: { x: 124, y: 283 },
  },
};

// Back view muscle paths
export const BACK_MUSCLES = {
  traps: {
    id: 'traps',
    name: 'Traps',
    path: 'M 85 75 Q 100 68 115 75 L 115 90 Q 100 85 85 90 Z',
    center: { x: 100, y: 80 },
  },
  back_upper: {
    id: 'back',
    name: 'Back',
    path: 'M 75 90 Q 72 105 75 120 L 125 120 Q 128 105 125 90 Q 100 85 75 90 Z',
    center: { x: 100, y: 105 },
  },
  back_lats_left: {
    id: 'back',
    name: 'Back',
    path: 'M 68 105 Q 65 125 70 150 L 80 150 Q 78 125 80 108 L 68 105 Z',
    center: { x: 74, y: 127 },
  },
  back_lats_right: {
    id: 'back',
    name: 'Back',
    path: 'M 132 105 Q 135 125 130 150 L 120 150 Q 122 125 120 108 L 132 105 Z',
    center: { x: 126, y: 127 },
  },
  triceps_left: {
    id: 'triceps',
    name: 'Triceps',
    path: 'M 55 108 Q 50 128 52 150 L 65 152 Q 68 130 65 112 L 55 108 Z',
    center: { x: 58, y: 130 },
  },
  triceps_right: {
    id: 'triceps',
    name: 'Triceps',
    path: 'M 145 108 Q 150 128 148 150 L 135 152 Q 132 130 135 112 L 145 108 Z',
    center: { x: 142, y: 130 },
  },
  forearms_left: {
    id: 'forearms',
    name: 'Forearms',
    path: 'M 50 152 Q 45 170 48 190 L 60 190 Q 62 170 60 154 L 50 152 Z',
    center: { x: 55, y: 170 },
  },
  forearms_right: {
    id: 'forearms',
    name: 'Forearms',
    path: 'M 150 152 Q 155 170 152 190 L 140 190 Q 138 170 140 154 L 150 152 Z',
    center: { x: 145, y: 170 },
  },
  glutes: {
    id: 'glutes',
    name: 'Glutes',
    path: 'M 75 160 Q 70 175 72 190 L 100 195 L 128 190 Q 130 175 125 160 Q 100 155 75 160 Z',
    center: { x: 100, y: 177 },
  },
  hamstrings_left: {
    id: 'hamstrings',
    name: 'Hamstrings',
    path: 'M 72 195 Q 68 225 70 260 L 85 262 Q 88 228 85 198 L 72 195 Z',
    center: { x: 78, y: 228 },
  },
  hamstrings_right: {
    id: 'hamstrings',
    name: 'Hamstrings',
    path: 'M 128 195 Q 132 225 130 260 L 115 262 Q 112 228 115 198 L 128 195 Z',
    center: { x: 122, y: 228 },
  },
  calves_left: {
    id: 'calves',
    name: 'Calves',
    path: 'M 70 265 Q 65 290 68 315 L 82 318 Q 86 292 82 268 L 70 265 Z',
    center: { x: 76, y: 290 },
  },
  calves_right: {
    id: 'calves',
    name: 'Calves',
    path: 'M 130 265 Q 135 290 132 315 L 118 318 Q 114 292 118 268 L 130 265 Z',
    center: { x: 124, y: 290 },
  },
  rear_delts_left: {
    id: 'shoulders',
    name: 'Shoulders',
    path: 'M 58 85 Q 52 95 55 110 L 68 108 Q 70 95 68 87 Q 63 82 58 85 Z',
    center: { x: 62, y: 97 },
  },
  rear_delts_right: {
    id: 'shoulders',
    name: 'Shoulders',
    path: 'M 142 85 Q 148 95 145 110 L 132 108 Q 130 95 132 87 Q 137 82 142 85 Z',
    center: { x: 138, y: 97 },
  },
};

// Body outline for silhouette
export const BODY_OUTLINE_FRONT = 
  'M 100 30 Q 115 30 120 45 L 122 60 Q 125 70 140 82 Q 150 90 152 110 Q 155 135 150 160 Q 148 175 152 195 L 155 210 Q 145 212 140 210 L 135 195 Q 132 175 138 155 L 142 140 Q 138 155 130 175 L 125 180 Q 132 220 128 260 Q 130 290 130 320 L 118 325 L 115 290 Q 118 260 115 220 L 110 195 Q 105 180 100 175 Q 95 180 90 195 L 85 220 Q 82 260 85 290 L 82 325 L 70 320 Q 70 290 72 260 Q 68 220 75 180 L 70 175 Q 62 155 58 140 L 62 155 Q 68 175 65 195 L 60 210 Q 55 212 45 210 L 48 195 Q 52 175 50 160 Q 45 135 48 110 Q 50 90 60 82 Q 75 70 78 60 L 80 45 Q 85 30 100 30 Z';

export const BODY_OUTLINE_BACK = 
  'M 100 30 Q 115 30 120 45 L 122 60 Q 125 70 140 82 Q 150 90 152 110 Q 155 135 150 160 Q 148 175 152 200 L 155 215 Q 145 217 140 215 L 135 200 Q 132 178 138 158 L 142 145 Q 138 158 130 178 L 125 185 Q 132 225 128 265 Q 130 295 130 325 L 118 330 L 115 295 Q 118 265 115 225 L 110 200 Q 105 185 100 180 Q 95 185 90 200 L 85 225 Q 82 265 85 295 L 82 330 L 70 325 Q 70 295 72 265 Q 68 225 75 185 L 70 178 Q 62 158 58 145 L 62 158 Q 68 178 65 200 L 60 215 Q 55 217 45 215 L 48 200 Q 52 175 50 160 Q 45 135 48 110 Q 50 90 60 82 Q 75 70 78 60 L 80 45 Q 85 30 100 30 Z';

// Muscle group to ID mapping for database linking
export const MUSCLE_GROUP_MAP: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  quadriceps: 'Quadriceps',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
  traps: 'Traps',
};

// Colors for muscle groups (matching the theme)
export const MUSCLE_COLORS: Record<string, { fill: string; hover: string; active: string }> = {
  chest: { fill: 'hsl(0, 70%, 55%)', hover: 'hsl(0, 70%, 65%)', active: 'hsl(0, 80%, 50%)' },
  back: { fill: 'hsl(199, 80%, 55%)', hover: 'hsl(199, 80%, 65%)', active: 'hsl(199, 90%, 50%)' },
  shoulders: { fill: 'hsl(280, 60%, 65%)', hover: 'hsl(280, 60%, 75%)', active: 'hsl(280, 70%, 60%)' },
  biceps: { fill: 'hsl(38, 85%, 55%)', hover: 'hsl(38, 85%, 65%)', active: 'hsl(38, 95%, 50%)' },
  triceps: { fill: 'hsl(38, 85%, 55%)', hover: 'hsl(38, 85%, 65%)', active: 'hsl(38, 95%, 50%)' },
  forearms: { fill: 'hsl(38, 70%, 50%)', hover: 'hsl(38, 70%, 60%)', active: 'hsl(38, 80%, 45%)' },
  quadriceps: { fill: 'hsl(142, 70%, 45%)', hover: 'hsl(142, 70%, 55%)', active: 'hsl(142, 80%, 40%)' },
  hamstrings: { fill: 'hsl(142, 60%, 40%)', hover: 'hsl(142, 60%, 50%)', active: 'hsl(142, 70%, 35%)' },
  glutes: { fill: 'hsl(142, 50%, 45%)', hover: 'hsl(142, 50%, 55%)', active: 'hsl(142, 60%, 40%)' },
  calves: { fill: 'hsl(142, 70%, 45%)', hover: 'hsl(142, 70%, 55%)', active: 'hsl(142, 80%, 40%)' },
  core: { fill: 'hsl(320, 65%, 65%)', hover: 'hsl(320, 65%, 75%)', active: 'hsl(320, 75%, 60%)' },
  traps: { fill: 'hsl(199, 70%, 50%)', hover: 'hsl(199, 70%, 60%)', active: 'hsl(199, 80%, 45%)' },
};
