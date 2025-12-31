export const VOMIT_COLORS = [
    '투명',
    '흰색',
    '사료토',
    '노란색',
    '갈색',
    '혈색',
] as const;

export type VomitColor = typeof VOMIT_COLORS[number];

export const DANGER_VOMIT_COLOR: VomitColor = '혈색';
