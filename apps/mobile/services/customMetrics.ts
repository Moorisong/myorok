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

export async function getMetricRecordByDate(metricId: string, date: string): Promise<CustomMetricRecord | null> {
    const db = await getDatabase();
    const records = await db.getAllAsync<CustomMetricRecord>(
        `SELECT * FROM custom_metric_records WHERE metricId = ? AND date = ?`,
        [metricId, date]
    );
    return records.length > 0 ? records[0] : null;
}

export async function updateMetricRecord(id: string, value: number, memo?: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
        `UPDATE custom_metric_records SET value = ?, memo = ? WHERE id = ?`,
        [value, memo || null, id]
    );
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

// ===== Adaptive Chart Support =====

export interface AggregatedRecord {
    date: string;   // "2026-01-01" (day) or "2026-W01" (week) or "2026-01" (month)
    value: number;  // Aggregated value (average)
    count: number;  // Number of records in period
    min: number;
    max: number;
}

export type AggregateUnit = 'day' | 'week' | 'month';
export type ChartType = 'DotChart' | 'LineChart' | 'BarChart' | 'SummaryCard';

export function selectChartType(recordCount: number): ChartType {
    if (recordCount <= 60) return 'DotChart';
    if (recordCount <= 180) return 'LineChart';
    if (recordCount <= 730) return 'BarChart';
    return 'SummaryCard';
}

export function recommendAggregateUnit(recordCount: number): AggregateUnit {
    if (recordCount <= 60) return 'day';
    if (recordCount <= 180) return 'week';
    return 'month';
}

export async function getMetricRecordsByDateRange(
    metricId: string,
    startDate: string,
    endDate: string
): Promise<CustomMetricRecord[]> {
    const db = await getDatabase();

    const records = await db.getAllAsync<CustomMetricRecord>(
        `SELECT * FROM custom_metric_records 
         WHERE metricId = ? AND date >= ? AND date <= ?
         ORDER BY date ASC`,
        [metricId, startDate, endDate]
    );

    return records;
}

export async function getMetricRecordCount(metricId: string): Promise<number> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM custom_metric_records WHERE metricId = ?`,
        [metricId]
    );
    return result?.count || 0;
}

export async function getMetricRecordsAggregated(
    metricId: string,
    startDate: string,
    endDate: string,
    unit: AggregateUnit
): Promise<AggregatedRecord[]> {
    const records = await getMetricRecordsByDateRange(metricId, startDate, endDate);

    if (records.length === 0) return [];

    // Group by unit
    const groups = new Map<string, number[]>();

    for (const record of records) {
        const key = getGroupKey(record.date, unit);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(record.value);
    }

    // Calculate aggregates
    const result: AggregatedRecord[] = [];
    for (const [date, values] of groups) {
        const sum = values.reduce((a, b) => a + b, 0);
        result.push({
            date,
            value: Math.round((sum / values.length) * 100) / 100, // Average, rounded to 2 decimals
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
        });
    }

    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));

    return result;
}

function getGroupKey(dateStr: string, unit: AggregateUnit): string {
    const date = new Date(dateStr);

    switch (unit) {
        case 'day':
            return dateStr; // YYYY-MM-DD
        case 'week':
            // Get ISO week number
            const startOfYear = new Date(date.getFullYear(), 0, 1);
            const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
            const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
            return `${date.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        case 'month':
            return dateStr.substring(0, 7); // YYYY-MM
    }
}

export async function getMetricSummaryStats(metricId: string): Promise<{
    min: number;
    max: number;
    avg: number;
    total: number;
    count: number;
    firstDate: string | null;
    lastDate: string | null;
} | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{
        minVal: number;
        maxVal: number;
        avgVal: number;
        totalVal: number;
        countVal: number;
        firstDate: string;
        lastDate: string;
    }>(
        `SELECT 
            MIN(value) as minVal,
            MAX(value) as maxVal,
            AVG(value) as avgVal,
            SUM(value) as totalVal,
            COUNT(*) as countVal,
            MIN(date) as firstDate,
            MAX(date) as lastDate
         FROM custom_metric_records 
         WHERE metricId = ?`,
        [metricId]
    );

    if (!result || result.countVal === 0) return null;

    return {
        min: result.minVal,
        max: result.maxVal,
        avg: Math.round(result.avgVal * 100) / 100,
        total: result.totalVal,
        count: result.countVal,
        firstDate: result.firstDate,
        lastDate: result.lastDate,
    };
}
