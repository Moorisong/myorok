import { getDatabase, generateId } from './database';

export interface MedicationMemo {
    id: string;
    petId: string;
    medicationName: string;
    memo: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}

export async function getMedicationMemos(petId: string): Promise<MedicationMemo[]> {
    const db = await getDatabase();
    const memos = await db.getAllAsync<MedicationMemo>(
        `SELECT * FROM medication_memos 
     WHERE petId = ? AND deletedAt IS NULL 
     ORDER BY updatedAt DESC`,
        [petId]
    );
    return memos;
}

export async function addMedicationMemo(
    petId: string,
    medicationName: string,
    memo?: string
): Promise<string> {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO medication_memos 
     (id, petId, medicationName, memo, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?)`,
        [id, petId, medicationName, memo || null, now, now]
    );

    return id;
}

export async function updateMedicationMemo(
    id: string,
    medicationName: string,
    memo?: string
): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `UPDATE medication_memos 
     SET medicationName = ?, memo = ?, updatedAt = ? 
     WHERE id = ?`,
        [medicationName, memo || null, now, id]
    );
}

export async function deleteMedicationMemo(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `UPDATE medication_memos 
     SET deletedAt = ? 
     WHERE id = ?`,
        [now, id]
    );
}
