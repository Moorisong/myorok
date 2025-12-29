import { getDatabase, getSelectedPetId, generateId, getTodayDateString } from './database';

export interface Supplement {
    id: string;
    petId: string;
    name: string;
    type: 'supplement' | 'medicine';
    createdAt: string;
    deletedAt?: string;
}

export interface SupplementRecord {
    id: string;
    supplementId: string;
    date: string;
    taken: number; // 0 or 1
    supplementName?: string; // 저장된 약/영양제 이름
}

// Supplement management
export async function addSupplement(
    name: string,
    type: 'supplement' | 'medicine'
): Promise<Supplement> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
        `INSERT INTO supplements (id, petId, name, type, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
        [id, petId, name, type, now]
    );

    return { id, petId, name, type, createdAt: now };
}

export async function getSupplements(): Promise<Supplement[]> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();

    const supplements = await db.getAllAsync<Supplement>(
        `SELECT * FROM supplements WHERE petId = ? AND deletedAt IS NULL ORDER BY createdAt ASC`,
        [petId]
    );

    return supplements;
}

export async function deleteSupplement(supplementId: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    // Soft delete: set deletedAt timestamp instead of hard delete
    await db.runAsync(
        'UPDATE supplements SET deletedAt = ? WHERE id = ?',
        [now, supplementId]
    );

    // Keep all supplement_records intact (historical records preserved)
}


// Daily supplement records
export async function toggleSupplementTaken(supplementId: string): Promise<boolean> {
    const db = await getDatabase();
    const today = getTodayDateString();

    const existing = await db.getFirstAsync<SupplementRecord>(
        `SELECT * FROM supplement_records WHERE supplementId = ? AND date = ?`,
        [supplementId, today]
    );

    if (existing) {
        const newTaken = existing.taken === 1 ? 0 : 1;
        await db.runAsync(
            `UPDATE supplement_records SET taken = ? WHERE id = ?`,
            [newTaken, existing.id]
        );
        return newTaken === 1;
    } else {
        // Get supplement name
        const supplement = await db.getFirstAsync<Supplement>(
            `SELECT name FROM supplements WHERE id = ?`,
            [supplementId]
        );

        const id = generateId();
        await db.runAsync(
            `INSERT INTO supplement_records (id, supplementId, date, taken, supplementName)
       VALUES (?, ?, ?, 1, ?)`,
            [id, supplementId, today, supplement?.name || '알 수 없음']
        );
        return true;
    }
}

export async function getTodaySupplementStatus(): Promise<Map<string, boolean>> {
    const db = await getDatabase();
    const today = getTodayDateString();

    const records = await db.getAllAsync<SupplementRecord>(
        `SELECT * FROM supplement_records WHERE date = ?`,
        [today]
    );

    const statusMap = new Map<string, boolean>();
    records.forEach(record => {
        statusMap.set(record.supplementId, record.taken === 1);
    });

    return statusMap;
}
export async function getRecentSupplementHistory(days: number = 30): Promise<(SupplementRecord & { name: string })[]> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();
    const d = new Date();
    d.setDate(d.getDate() - days);
    const startYear = d.getFullYear();
    const startMonth = String(d.getMonth() + 1).padStart(2, '0');
    const startDay = String(d.getDate()).padStart(2, '0');
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const records = await db.getAllAsync<SupplementRecord & { name: string }>(
        `SELECT sr.*, COALESCE(sr.supplementName, s.name, '(삭제된 항목)') as name
         FROM supplement_records sr
         LEFT JOIN supplements s ON sr.supplementId = s.id
         WHERE s.petId = ? AND sr.date >= ?
         ORDER BY sr.date ASC`,
        [petId, startDate]
    );

    return records;
}
