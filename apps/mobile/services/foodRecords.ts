import { getDatabase, getDefaultPetId, generateId, getTodayDateString } from './database';

export interface FoodRecord {
    id: string;
    petId: string;
    date: string;
    foodType: 'can' | 'dry' | 'etc';
    preference: 'good' | 'normal' | 'reject';
    comment: string | null;
    createdAt: string;
}

export async function addFoodRecord(
    foodType: FoodRecord['foodType'],
    preference: FoodRecord['preference'],
    comment?: string
): Promise<FoodRecord> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();
    const today = getTodayDateString();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
        `INSERT INTO food_records (id, petId, date, foodType, preference, comment, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, petId, today, foodType, preference, comment || null, now]
    );

    return {
        id,
        petId,
        date: today,
        foodType,
        preference,
        comment: comment || null,
        createdAt: now,
    };
}

export async function getFoodRecords(limit = 30): Promise<FoodRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();

    const records = await db.getAllAsync<FoodRecord>(
        `SELECT * FROM food_records 
     WHERE petId = ? 
     ORDER BY date DESC, createdAt DESC
     LIMIT ?`,
        [petId, limit]
    );

    return records;
}

export async function getTodayFoodRecords(): Promise<FoodRecord[]> {
    const db = await getDatabase();
    const petId = await getDefaultPetId();
    const today = getTodayDateString();

    const records = await db.getAllAsync<FoodRecord>(
        `SELECT * FROM food_records 
     WHERE petId = ? AND date = ?
     ORDER BY createdAt DESC`,
        [petId, today]
    );

    return records;
}
