import { getDatabase, getSelectedPetId, generateId } from './database';

export interface Pet {
    id: string;
    name: string;
    createdAt: string;
    deletedAt?: string;
}

export async function getAllPets(includeDeleted: boolean = false): Promise<Pet[]> {
    const db = await getDatabase();

    const query = includeDeleted
        ? 'SELECT * FROM pets ORDER BY createdAt ASC'
        : 'SELECT * FROM pets WHERE deletedAt IS NULL ORDER BY createdAt ASC';

    const pets = await db.getAllAsync<Pet>(query);
    return pets;
}

export async function getPetById(id: string): Promise<Pet | null> {
    const db = await getDatabase();

    const pet = await db.getFirstAsync<Pet>(
        'SELECT * FROM pets WHERE id = ?',
        [id]
    );

    return pet || null;
}

export async function addPet(name: string): Promise<Pet> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
        'INSERT INTO pets (id, name, createdAt) VALUES (?, ?, ?)',
        [id, name, now]
    );

    return { id, name, createdAt: now };
}

export async function updatePet(id: string, name: string): Promise<void> {
    const db = await getDatabase();

    await db.runAsync(
        'UPDATE pets SET name = ? WHERE id = ?',
        [name, id]
    );
}

export async function deletePet(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    // Soft delete: set deletedAt timestamp
    await db.runAsync(
        'UPDATE pets SET deletedAt = ? WHERE id = ?',
        [now, id]
    );
}

export async function restorePet(id: string): Promise<void> {
    const db = await getDatabase();

    // Restore: set deletedAt to NULL
    await db.runAsync(
        'UPDATE pets SET deletedAt = NULL WHERE id = ?',
        [id]
    );
}

export async function permanentDeletePet(id: string): Promise<void> {
    const db = await getDatabase();

    // Delete the pet from the pets table
    // Records remain in other tables (they still have the petId)
    await db.runAsync(
        'DELETE FROM pets WHERE id = ?',
        [id]
    );
}
