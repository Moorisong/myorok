import { getDatabase, generateId } from './database';

export interface FoodPreferenceMemo {
    id: string;
    petId: string;
    foodName: string;
    foodType: 'dry' | 'wet';
    memo: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export async function getFoodPreferenceMemos(petId: string): Promise<FoodPreferenceMemo[]> {
    const db = await getDatabase();
    const memos = await db.getAllAsync<FoodPreferenceMemo>(
        `SELECT * FROM food_preference_memos 
     WHERE petId = ? AND deletedAt IS NULL 
     ORDER BY updatedAt DESC`,
        [petId]
    );
    return memos;
}

export async function addFoodPreferenceMemo(
    petId: string,
    foodName: string,
    foodType: 'dry' | 'wet',
    memo?: string
): Promise<string> {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO food_preference_memos 
     (id, petId, foodName, foodType, memo, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, petId, foodName, foodType, memo || null, now, now]
    );

    return id;
}

export async function updateFoodPreferenceMemo(
    id: string,
    foodName: string,
    foodType: 'dry' | 'wet',
    memo?: string
): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `UPDATE food_preference_memos 
     SET foodName = ?, foodType = ?, memo = ?, updatedAt = ? 
     WHERE id = ?`,
        [foodName, foodType, memo || null, now, id]
    );
}

export async function deleteFoodPreferenceMemo(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `UPDATE food_preference_memos 
     SET deletedAt = ? 
     WHERE id = ?`,
        [now, id]
    );
}
