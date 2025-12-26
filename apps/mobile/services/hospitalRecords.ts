import { getDatabase, getDefaultPetId, generateId, getTodayDateString } from './database';

export interface HospitalRecord {
    id: string;
    petId: string;
    date: string;
    memo: string | null;
    createdAt: string;
}

export async function addHospitalRecord(
    date: string,
    memo?: string
): Promise<HospitalRecord> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
        `INSERT INTO hospital_records (id, petId, date, memo, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
        [id, petId, date, memo || null, now]
    );

    return {
        id,
        petId,
        date,
        memo: memo || null,
        createdAt: now,
    };
}

export async function getHospitalRecords(limit = 50): Promise<HospitalRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();

    const records = await db.getAllAsync<HospitalRecord>(
        `SELECT * FROM hospital_records 
     WHERE petId = ? 
     ORDER BY date DESC
     LIMIT ?`,
        [petId, limit]
    );

    return records;
}
