import { getDatabase, getSelectedPetId } from './database';
import { DailyRecord } from './dailyRecords';
import { SupplementRecord, Supplement } from './supplements';
import { FluidRecord } from './fluidRecords';

export interface CalendarDayData {
    date: string;
    hasRecord: boolean;
    hasDiarrheaOrVomit: boolean;
    hasMedicine: boolean;
    hasFluid: boolean;
    dailyRecord?: DailyRecord;
    supplements?: { name: string; taken: boolean; isDeleted?: boolean }[];
    fluidRecords?: FluidRecord[];
}

export async function getMonthRecords(year: number, month: number): Promise<Map<string, CalendarDayData>> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();

    // Format: YYYY-MM
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const result = new Map<string, CalendarDayData>();

    // Get daily records for the month
    const dailyRecords = await db.getAllAsync<DailyRecord>(
        `SELECT * FROM daily_records 
     WHERE petId = ? AND date LIKE ?
     ORDER BY date ASC`,
        [petId, `${monthStr}%`]
    );

    // Get supplement records for the month
    const supplementRecords = await db.getAllAsync<SupplementRecord & { name: string; isDeleted: number }>(
        `SELECT sr.*, COALESCE(sr.supplementName, s.name, '(삭제된 항목)') as name,
                CASE WHEN s.deletedAt IS NOT NULL THEN 1 ELSE 0 END as isDeleted
     FROM supplement_records sr
     LEFT JOIN supplements s ON sr.supplementId = s.id
     WHERE s.petId = ? AND sr.date LIKE ?`,
        [petId, `${monthStr}%`]
    );

    // Get fluid records for the month
    const fluidRecords = await db.getAllAsync<FluidRecord>(
        `SELECT * FROM fluid_records 
     WHERE petId = ? AND date LIKE ?`,
        [petId, `${monthStr}%`]
    );

    // Process daily records
    for (const record of dailyRecords) {
        result.set(record.date, {
            date: record.date,
            hasRecord: true,
            hasDiarrheaOrVomit: record.diarrheaCount > 0 || record.vomitCount > 0,
            hasMedicine: false,
            hasFluid: false,
            dailyRecord: record,
            supplements: [],
            fluidRecords: [],
        });
    }

    // Process supplement records
    for (const sr of supplementRecords) {
        if (!result.has(sr.date)) {
            result.set(sr.date, {
                date: sr.date,
                hasRecord: true,
                hasDiarrheaOrVomit: false,
                hasMedicine: sr.taken === 1,
                hasFluid: false,
                supplements: [],
                fluidRecords: [],
            });
        }
        const dayData = result.get(sr.date)!;
        if (sr.taken === 1) {
            dayData.hasMedicine = true;
        }
        dayData.supplements?.push({
            name: sr.name,
            taken: sr.taken === 1,
            isDeleted: sr.isDeleted === 1
        });
    }

    // Process fluid records
    for (const fr of fluidRecords) {
        if (!result.has(fr.date)) {
            result.set(fr.date, {
                date: fr.date,
                hasRecord: true,
                hasDiarrheaOrVomit: false,
                hasMedicine: false,
                hasFluid: true,
                fluidRecords: [fr],
            });
        } else {
            const dayData = result.get(fr.date)!;
            dayData.hasFluid = true;
            if (!dayData.fluidRecords) dayData.fluidRecords = [];
            dayData.fluidRecords.push(fr);
        }
    }

    return result;
}

export async function getDayDetail(date: string): Promise<CalendarDayData | null> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();

    const dailyRecord = await db.getFirstAsync<DailyRecord>(
        `SELECT * FROM daily_records WHERE petId = ? AND date = ?`,
        [petId, date]
    );

    const supplementRecords = await db.getAllAsync<SupplementRecord & { name: string; isDeleted: number }>(
        `SELECT sr.*, COALESCE(sr.supplementName, s.name, '(삭제된 항목)') as name,
                CASE WHEN s.deletedAt IS NOT NULL THEN 1 ELSE 0 END as isDeleted
     FROM supplement_records sr
     LEFT JOIN supplements s ON sr.supplementId = s.id
     WHERE s.petId = ? AND sr.date = ?`,
        [petId, date]
    );

    const fluidRecords = await db.getAllAsync<FluidRecord>(
        `SELECT * FROM fluid_records WHERE petId = ? AND date = ?`,
        [petId, date]
    );

    if (!dailyRecord && supplementRecords.length === 0 && fluidRecords.length === 0) {
        return null;
    }

    return {
        date,
        hasRecord: true,
        hasDiarrheaOrVomit: dailyRecord ? (dailyRecord.diarrheaCount > 0 || dailyRecord.vomitCount > 0) : false,
        hasMedicine: supplementRecords.some(sr => sr.taken === 1),
        hasFluid: fluidRecords.length > 0,
        dailyRecord: dailyRecord || undefined,
        supplements: supplementRecords.map(sr => ({
            name: sr.name,
            taken: sr.taken === 1,
            isDeleted: sr.isDeleted === 1
        })),
        fluidRecords,
    };
}
