export { getDatabase, getDefaultPetId, generateId, getTodayDateString } from './database';
export { getTodayRecord, updateDailyRecord, getRecentRecords } from './dailyRecords';
export type { DailyRecord } from './dailyRecords';

export { addFoodRecord, getFoodRecords, getTodayFoodRecords } from './foodRecords';
export type { FoodRecord } from './foodRecords';

export { addSupplement, getSupplements, deleteSupplement, toggleSupplementTaken, getTodaySupplementStatus } from './supplements';
export type { Supplement, SupplementRecord } from './supplements';

export { addHospitalRecord, getHospitalRecords } from './hospitalRecords';
export type { HospitalRecord } from './hospitalRecords';

export { addFluidRecord, getFluidRecords, getTodayFluidRecords, deleteFluidRecord } from './fluidRecords';
export type { FluidRecord } from './fluidRecords';

export { addCustomMetric, getCustomMetrics, addMetricRecord, getMetricRecords, getAllMetricRecords } from './customMetrics';
export type { CustomMetric, CustomMetricRecord } from './customMetrics';

export { getMonthRecords, getDayDetail } from './calendar';
export type { CalendarDayData } from './calendar';

