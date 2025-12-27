import { getDatabase, getDefaultPetId, generateId, getTodayDateString } from './database';

export interface DailyRecord {
    id: string;
    petId: string;
    date: string;
    peeCount: number;
    poopCount: number;
    diarrheaCount: number;
    vomitCount: number;
    vomitTypes: string | null;
    waterIntake: number;
    memo: string | null;
    createdAt: string;
    updatedAt: string;
}

export async function getTodayRecord(): Promise<DailyRecord> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();
    const today = getTodayDateString();

    let record = await db.getFirstAsync<DailyRecord>(
        'SELECT * FROM daily_records WHERE petId = ? AND date = ?',
        [petId, today]
    );

    if (!record) {
        const now = new Date().toISOString();
        const id = generateId();

        await db.runAsync(
            `INSERT INTO daily_records 
       (id, petId, date, peeCount, poopCount, diarrheaCount, vomitCount, vomitTypes, waterIntake, memo, createdAt, updatedAt)
       VALUES (?, ?, ?, 0, 0, 0, 0, NULL, 0, NULL, ?, ?)`,
            [id, petId, today, now, now]
        );

        record = {
            id,
            petId,
            date: today,
            peeCount: 0,
            poopCount: 0,
            diarrheaCount: 0,
            vomitCount: 0,
            vomitTypes: null,
            waterIntake: 0,
            memo: null,
            createdAt: now,
            updatedAt: now,
        };
    }

    return record;
}

export async function updateDailyRecord(
    updates: Partial<Pick<DailyRecord, 'peeCount' | 'poopCount' | 'diarrheaCount' | 'vomitCount' | 'vomitTypes' | 'waterIntake' | 'memo'>>
): Promise<void> {
    const db = await getDatabase();
    const record = await getTodayRecord();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.peeCount !== undefined) {
        fields.push('peeCount = ?');
        values.push(updates.peeCount);
    }
    if (updates.poopCount !== undefined) {
        fields.push('poopCount = ?');
        values.push(updates.poopCount);
    }
    if (updates.diarrheaCount !== undefined) {
        fields.push('diarrheaCount = ?');
        values.push(updates.diarrheaCount);
    }
    if (updates.vomitCount !== undefined) {
        fields.push('vomitCount = ?');
        values.push(updates.vomitCount);
    }
    if (updates.vomitTypes !== undefined) {
        fields.push('vomitTypes = ?');
        values.push(updates.vomitTypes);
    }
    if (updates.waterIntake !== undefined) {
        fields.push('waterIntake = ?');
        values.push(updates.waterIntake);
    }
    if (updates.memo !== undefined) {
        fields.push('memo = ?');
        values.push(updates.memo);
    }

    if (fields.length === 0) return;

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(record.id);

    await db.runAsync(
        `UPDATE daily_records SET ${fields.join(', ')} WHERE id = ?`,
        values
    );
}

export async function getLast7DaysRecords(): Promise<DailyRecord[]> {
    return getRecentDailyRecords(7);
}

export async function getRecentDailyRecords(days: number): Promise<DailyRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();
    const today = getTodayDateString();

    // Calculate start date
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    const startYear = d.getFullYear();
    const startMonth = String(d.getMonth() + 1).padStart(2, '0');
    const startDay = String(d.getDate()).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const records = await db.getAllAsync<DailyRecord>(
        `SELECT * FROM daily_records 
         WHERE petId = ? AND date >= ? AND date <= ? 
         ORDER BY date ASC`,
        [petId, startDate, today]
    );

    return records;
}
export async function getRecentRecords(days: number): Promise<DailyRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();

    const records = await db.getAllAsync<DailyRecord>(
        `SELECT * FROM daily_records 
     WHERE petId = ? 
     ORDER BY date DESC 
     LIMIT ?`,
        [petId, days]
    );

    return records;
}
