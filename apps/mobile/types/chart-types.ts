// Chart Types for Summary Screen

export type Period = '15d' | '1m' | '3m' | 'all';

export interface ChartData {
  date: string;
  poop: number;
  diarrhea: number;
  vomit: number;
}

export interface HydrationData {
  date: string;
  water: number;
  force: number;
  fluid: number;
}

// Medicine Chart - Timeline Segment
export interface MedicineSegment {
  type: 'bar' | 'dot';
  startIndex: number; // 0 to 14 (relative to current view window)
  length: number;     // 1 for dot, >=2 for bar
  dateLabel?: string; // For dot hover/display
}

// Pro Features - Weekly Segment
export interface WeekSegment {
  weekIndex: number;
  count: number;
  type: 'thick' | 'thin' | 'dot' | 'none';
  label: string; // e.g. "3rd week of Mar"
}

export interface MedicineSummary {
  startDate: string;
  endDate: string;
  totalDays: number;
  avgFreq: string; // "Weekly 4.2 times"
}

export interface MedicineRow {
  name: string;
  isDeleted: boolean;
  segments: MedicineSegment[];    // For 15d, 1m
  weekSegments?: WeekSegment[];   // For 3m
  summary?: MedicineSummary;      // For all
}

// Overall Summary Data for 'all' period
export interface OverallSummaryData {
  // 기록 기간
  firstRecordDate: string;
  lastRecordDate: string;
  totalDays: number;

  // 증상 요약
  totalVomit: number;
  diarrheaDays: number;
  avgPoop: number;

  // 강수/수액 요약
  totalForce: number;
  totalFluid: number;

  // 관리 밀도
  recordedDays: number;
  recordingRate: number;
}

// Weekly aggregation for 3-month charts
export interface WeeklyChartData {
  weekLabel: string;  // e.g., "W1", "W2"
  poop: number;
  diarrhea: number;
  vomit: number;
}

export interface WeeklyHydrationData {
  weekLabel: string;
  force: number;
  fluid: number;
}
