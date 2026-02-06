import { getDatabase, generateId, getSelectedPetId } from './database';
import { addPet, getAllPets } from './pets';
import { getCurrentUserId } from './auth';

/**
 * 1년간의 무작위 테스트 데이터 생성 (현재 선택된 고양이)
 * - 고양이가 없으면 1마리 생성
 * - 365일치 daily_records 생성
 * - 수분 섭취 기록 생성
 * - 영양제/약 생성 및 섭취 기록
 * - 커스텀 수치 생성 및 기록
 */
export async function generateTestData(): Promise<{ petsCreated: number; recordsCreated: number }> {
    const db = await getDatabase();
    const userId = await getCurrentUserId();

    // 1. 고양이 확인/생성
    let pets = await getAllPets();
    let petsCreated = 0;

    if (pets.length === 0) {
        await addPet('테스트 냥이');
        pets = await getAllPets();
        petsCreated = 1;
    }

    // 현재 선택된 고양이의 데이터를 생성
    const petId = await getSelectedPetId();
    const now = new Date();
    let recordsCreated = 0;

    // 2. 1년(365일)치 daily_records 생성
    for (let i = 0; i < 365; i++) {
        const recordDate = new Date(now);
        recordDate.setDate(recordDate.getDate() - i);
        const dateStr = recordDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const timestamp = recordDate.toISOString();

        // 이미 있는 기록은 스킵
        const existing = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM daily_records WHERE petId = ? AND date = ?',
            [petId, dateStr]
        );

        if (existing) continue;

        // 무작위 데이터 생성
        const peeCount = randomInt(1, 5);
        const poopCount = randomInt(0, 3);
        const diarrheaCount = Math.random() < 0.1 ? randomInt(1, 2) : 0; // 10% 확률로 설사
        const vomitCount = Math.random() < 0.05 ? randomInt(1, 2) : 0; // 5% 확률로 구토
        const waterIntake = randomInt(30, 150);
        const memo = Math.random() < 0.3 ? getRandomMemo() : null; // 30% 확률로 메모

        const id = generateId();
        await db.runAsync(
            `INSERT INTO daily_records 
             (id, petId, date, peeCount, poopCount, diarrheaCount, vomitCount, vomitTypes, waterIntake, memo, createdAt, updatedAt, userId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, petId, dateStr, peeCount, poopCount, diarrheaCount, vomitCount, null, waterIntake, memo, timestamp, timestamp, userId]
        );
        recordsCreated++;
    }

    // 3. 수분 섭취 기록 (fluid_records) 생성
    for (let i = 0; i < 365; i++) {
        const recordDate = new Date(now);
        recordDate.setDate(recordDate.getDate() - i);
        const dateStr = recordDate.toISOString().split('T')[0];
        const timestamp = recordDate.toISOString();

        // 이미 있는 기록은 스킵
        const existing = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM fluid_records WHERE petId = ? AND date = ?',
            [petId, dateStr]
        );

        if (existing) continue;

        // 하루에 1-3번 수분 섭취 기록
        const intakeCount = randomInt(1, 3);
        for (let j = 0; j < intakeCount; j++) {
            const id = generateId();
            const volume = randomInt(10, 50);
            // 60% 물, 20% 습식사료, 10% 강수, 10% 수액
            const rand = Math.random();
            let fluidType: string;
            if (rand < 0.6) {
                fluidType = 'water';
            } else if (rand < 0.8) {
                fluidType = 'wet_food';
            } else if (rand < 0.9) {
                fluidType = 'force';  // 강수
            } else {
                fluidType = 'fluid';  // 수액
            }

            await db.runAsync(
                `INSERT INTO fluid_records (id, petId, date, fluidType, volume, createdAt, userId)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, petId, dateStr, fluidType, volume, timestamp, userId]
            );
        }
    }

    // 4. 영양제/약 생성 및 섭취 기록
    const supplementNames = [
        { name: '유산균', type: 'supplement' },
        { name: '오메가3', type: 'supplement' },
        { name: '유리놀', type: 'supplement' },
        { name: '타우린', type: 'supplement' },
        { name: '신장약', type: 'medication' },
        { name: '항생제', type: 'medication' },
    ];

    // 기존 영양제 확인
    const existingSupplements = await db.getAllAsync<{ id: string; name: string }>(
        'SELECT id, name FROM supplements WHERE petId = ?',
        [petId]
    );

    const supplementIds: string[] = [];
    const createdAt = now.toISOString();

    // 영양제가 없으면 새로 생성
    if (existingSupplements.length === 0) {
        // 2-4개 랜덤 선택
        const shuffled = supplementNames.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, randomInt(2, 4));

        for (const supp of selected) {
            const id = generateId();
            await db.runAsync(
                `INSERT INTO supplements (id, petId, name, type, createdAt, userId)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id, petId, supp.name, supp.type, createdAt, userId]
            );
            supplementIds.push(id);
        }
    } else {
        supplementIds.push(...existingSupplements.map(s => s.id));
    }

    // 365일치 영양제 섭취 기록 생성
    for (const suppId of supplementIds) {
        for (let i = 0; i < 365; i++) {
            const recordDate = new Date(now);
            recordDate.setDate(recordDate.getDate() - i);
            const dateStr = recordDate.toISOString().split('T')[0];

            // 이미 있는 기록은 스킵
            const existing = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM supplement_records WHERE supplementId = ? AND date = ?',
                [suppId, dateStr]
            );

            if (existing) continue;

            // 85% 확률로 복용
            const taken = Math.random() < 0.85 ? 1 : 0;
            const id = generateId();

            await db.runAsync(
                `INSERT INTO supplement_records (id, supplementId, date, taken, petId, userId)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id, suppId, dateStr, taken, petId, userId]
            );
        }
    }

    // 5. 커스텀 수치 생성 및 기록
    const customMetricDefs = [
        { name: '체중', unit: 'kg', min: 3.5, max: 5.5 },
        { name: '혈당', unit: 'mg/dL', min: 80, max: 150 },
        { name: '체온', unit: '°C', min: 37.5, max: 39.5 },
    ];

    // 기존 커스텀 수치 확인
    const existingMetrics = await db.getAllAsync<{ id: string; name: string }>(
        'SELECT id, name FROM custom_metrics WHERE petId = ?',
        [petId]
    );

    interface MetricInfo { id: string; min: number; max: number; }
    const metricInfos: MetricInfo[] = [];

    // 커스텀 수치가 없으면 새로 생성
    if (existingMetrics.length === 0) {
        // 1-2개 랜덤 선택
        const shuffled = customMetricDefs.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, randomInt(1, 2));

        for (const metric of selected) {
            const id = generateId();
            await db.runAsync(
                `INSERT INTO custom_metrics (id, petId, name, unit, createdAt, userId)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id, petId, metric.name, metric.unit, createdAt, userId]
            );
            metricInfos.push({ id, min: metric.min, max: metric.max });
        }
    } else {
        // 기존 메트릭 사용 - 이름으로 min/max 매칭
        for (const existing of existingMetrics) {
            const def = customMetricDefs.find(d => d.name === existing.name);
            if (def) {
                metricInfos.push({ id: existing.id, min: def.min, max: def.max });
            } else {
                metricInfos.push({ id: existing.id, min: 0, max: 100 });
            }
        }
    }

    // 365일치 커스텀 수치 기록 생성 (주 1-2회 정도)
    for (const metric of metricInfos) {
        for (let i = 0; i < 365; i++) {
            // 약 20% 확률로 기록 (주 1-2회)
            if (Math.random() > 0.2) continue;

            const recordDate = new Date(now);
            recordDate.setDate(recordDate.getDate() - i);
            const dateStr = recordDate.toISOString().split('T')[0];
            const timestamp = recordDate.toISOString();

            // 이미 있는 기록은 스킵
            const existing = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM custom_metric_records WHERE metricId = ? AND date = ?',
                [metric.id, dateStr]
            );

            if (existing) continue;

            const value = randomFloat(metric.min, metric.max);
            const id = generateId();

            await db.runAsync(
                `INSERT INTO custom_metric_records (id, metricId, date, value, memo, createdAt, petId, userId)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, metric.id, dateStr, value, null, timestamp, petId, userId]
            );
        }
    }

    console.log(`[TestData] Created ${petsCreated} pets and ${recordsCreated} records`);
    return { petsCreated, recordsCreated };
}

/**
 * 모든 테스트 데이터 삭제
 */
export async function clearAllTestData(): Promise<void> {
    const db = await getDatabase();

    await db.runAsync('DELETE FROM daily_records');
    await db.runAsync('DELETE FROM fluid_records');
    await db.runAsync('DELETE FROM supplement_records');
    await db.runAsync('DELETE FROM supplements');
    await db.runAsync('DELETE FROM custom_metric_records');
    await db.runAsync('DELETE FROM custom_metrics');
    await db.runAsync('DELETE FROM pets');

    console.log('[TestData] All data cleared');
}

// 유틸리티 함수들
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function getRandomMemo(): string {
    const memos = [
        '오늘 컨디션 좋음',
        '밥 잘 먹음',
        '조금 졸려 보임',
        '놀이 시간 많이 가짐',
        '털 상태 좋음',
        '병원 방문함',
        '새 장난감에 관심 보임',
        '햇볕 좋아함',
        '물 많이 마심',
        '식욕 좋음',
    ];
    return memos[Math.floor(Math.random() * memos.length)];
}
