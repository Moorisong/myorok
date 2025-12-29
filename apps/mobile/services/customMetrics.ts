import { getDatabase, getSelectedPetId, generateId, getTodayDateString } from './database';

export interface CustomMetric {
    id: string;
    petId: string;
    name: string;
    unit: string | null;
    createdAt: string;
}

export interface CustomMetricRecord {
    id: string;
    metricId: string;
    date: string;
    value: number;
    memo: string | null;
    createdAt: string;
}

// Metric definition management
export async function addCustomMetric(
    name: string,
    unit?: string
): Promise<CustomMetric> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
        `INSERT INTO custom_metrics (id, petId, name, unit, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
        [id, petId, name, unit || null, now]
    );

    return { id, petId, name, unit: unit || null, createdAt: now };
}

export async function getCustomMetrics(): Promise<CustomMetric[]> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();

    const metrics = await db.getAllAsync<CustomMetric>(
        `SELECT * FROM custom_metrics WHERE petId = ? ORDER BY createdAt ASC`,
        [petId]
    );

    return metrics;
}

export async function deleteCustomMetric(id: string): Promise<void> {
    const db = await getDatabase();
    // Optional: Delete records too? 
    // For now, let's just delete the metric definition so it doesn't show up in the list.
    // Preserving records might be better for "Data is Asset", but orphaned records are useless without a metric def.
    // Let's delete both to keep it clean as per explicit user action.
    await db.runAsync('DELETE FROM custom_metrics WHERE id = ?', [id]);
    await db.runAsync('DELETE FROM custom_metric_records WHERE metricId = ?', [id]);
}

// Metric value records
export async function addMetricRecord(
    metricId: string,
    value: number,
    date?: string,
    memo?: string
): Promise<CustomMetricRecord> {
    const db = await getDatabase();
    const recordDate = date || getTodayDateString();
    const now = new Date().toISOString();
    const id = generateId();

    await db.runAsync(
        `INSERT INTO custom_metric_records (id, metricId, date, value, memo, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [id, metricId, recordDate, value, memo || null, now]
    );

    return {
        id,
        metricId,
        date: recordDate,
        value,
        memo: memo || null,
        createdAt: now,
    };
}

export async function getMetricRecords(metricId: string, limit = 30): Promise<CustomMetricRecord[]> {
    const db = await getDatabase();

    const records = await db.getAllAsync<CustomMetricRecord>(
        `SELECT * FROM custom_metric_records 
     WHERE metricId = ? 
     ORDER BY date DESC
     LIMIT ?`,
        [metricId, limit]
    );

    return records;
}

export async function getAllMetricRecords(limit = 100): Promise<(CustomMetricRecord & { metricName: string; metricUnit: string | null })[]> {
    const db = await getDatabase();
    const petId = await getSelectedPetId();

    const records = await db.getAllAsync<CustomMetricRecord & { metricName: string; metricUnit: string | null }>(
        `SELECT cmr.*, cm.name as metricName, cm.unit as metricUnit
     FROM custom_metric_records cmr
     JOIN custom_metrics cm ON cmr.metricId = cm.id
     WHERE cm.petId = ?
     ORDER BY cmr.date DESC, cmr.createdAt DESC
     LIMIT ?`,
        [petId, limit]
    );

    return records;
}
