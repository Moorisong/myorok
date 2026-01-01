export { getDatabase, getDefaultPetId, generateId, getTodayDateString } from './database';
export { getTodayRecord, updateDailyRecord, getRecentRecords } from './dailyRecords';
export type { DailyRecord } from './dailyRecords';



export { addSupplement, getSupplements, deleteSupplement, toggleSupplementTaken, getTodaySupplementStatus } from './supplements';
export type { Supplement, SupplementRecord } from './supplements';



export { addFluidRecord, getFluidRecords, getTodayFluidRecords, deleteFluidRecord } from './fluidRecords';
export type { FluidRecord } from './fluidRecords';

export { addCustomMetric, getCustomMetrics, addMetricRecord, getMetricRecords, getAllMetricRecords } from './customMetrics';
export type { CustomMetric, CustomMetricRecord } from './customMetrics';

export { getMonthRecords, getDayDetail } from './calendar';
export type { CalendarDayData } from './calendar';

export { getAllPets, getPetById, addPet, updatePet, deletePet, restorePet, permanentDeletePet } from './pets';
export type { Pet } from './pets';

export { getSelectedPetId, setSelectedPetId } from './database';

// Device ID 서비스
export { getDeviceId } from './device';

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
    debugAction,
    ApiResponse,
} from './comfort';
export type { ComfortPost, ComfortComment } from './comfort';



export {
    getMedicationMemos,
    addMedicationMemo,
    updateMedicationMemo,
    deleteMedicationMemo
} from './medicationMemos';
export type { MedicationMemo } from './medicationMemos';

export {
    getFoodPreferenceMemos,
    addFoodPreferenceMemo,
    updateFoodPreferenceMemo,
    deleteFoodPreferenceMemo
} from './foodPreferenceMemos';
export type { FoodPreferenceMemo } from './foodPreferenceMemos';

// Subscription service
export {
    initializeSubscription,
    getSubscriptionStatus,
    isAppAccessAllowed,
    activateSubscription,
    shouldShowTrialWarning,
    getTrialCountdownText,
    resetSubscription,
    markTrialNotificationAsSent,
    // User-based subscription functions (for Kakao login)
    getSubscriptionStatusForUser,
    startTrialForUser,
    activateSubscriptionForUser,
    expireSubscriptionForUser,
} from './subscription';
export type { SubscriptionStatus, SubscriptionState } from './subscription';

