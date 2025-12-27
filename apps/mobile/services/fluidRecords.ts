import { getDatabase, getDefaultPetId, generateId, getTodayDateString } from './database';

export interface FluidRecord {
    id: string;
    petId: string;
    date: string;
    fluidType: string;
    volume: number | null;
    memo: string | null;
    createdAt: string;
}

export async function addFluidRecord(
    fluidType: string,
    volume?: number,
    memo?: string
): Promise<FluidRecord> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();
    const today = getTodayDateString();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
        `INSERT INTO fluid_records (id, petId, date, fluidType, volume, memo, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, petId, today, fluidType, volume || null, memo || null, now]
    );

    return {
        id,
        petId,
        date: today,
        fluidType,
        volume: volume || null,
        memo: memo || null,
        createdAt: now,
    };
}

export async function getFluidRecords(limit = 30): Promise<FluidRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();

    const records = await db.getAllAsync<FluidRecord>(
        `SELECT * FROM fluid_records 
     WHERE petId = ? 
     ORDER BY date DESC, createdAt DESC
     LIMIT ?`,
        [petId, limit]
    );

    return records;
}

export async function getTodayFluidRecords(): Promise<FluidRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();
    const today = getTodayDateString();

    const records = await db.getAllAsync<FluidRecord>(
        `SELECT * FROM fluid_records 
     WHERE petId = ? AND date = ?
     ORDER BY createdAt DESC`,
        [petId, today]
    );

    return records;
}

export async function deleteFluidRecord(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM fluid_records WHERE id = ?', [id]);
}

export async function getRecentFluidHistory(days: number): Promise<FluidRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();

    // Calculate start date
    const d = new Date();
    d.setDate(d.getDate() - (days - 1));
    const startYear = d.getFullYear();
    const startMonth = String(d.getMonth() + 1).padStart(2, '0');
    const startDay = String(d.getDate()).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const records = await db.getAllAsync<FluidRecord>(
        `SELECT * FROM fluid_records 
         WHERE petId = ? AND date >= ? 
         ORDER BY date ASC, createdAt ASC`,
        [petId, startDate]
    );

    return records;
}
