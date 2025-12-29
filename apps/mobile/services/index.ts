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

export { getAllPets, getPetById, addPet, updatePet, deletePet, restorePet, permanentDeletePet } from './pets';
export type { Pet } from './pets';

export { getSelectedPetId, setSelectedPetId } from './database';

// PIN 서비스
export { getPinStatus, setPin, verifyPin, removePin, getDeviceId } from './pin';

// Comfort 서비스
export {
    getPosts,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    getComments,
    createComment,
    updateComment,
    deleteComment,
    reportPost,
    blockUser,
    unblockUser,
    getBlockedUsers,
} from './comfort';
export type { ComfortPost, ComfortComment } from './comfort';


