import { getDatabase, generateId } from './database';
import { addPet, getAllPets } from './pets';
import { getCurrentUserId } from './auth';

/**
 * 3개월간의 무작위 테스트 데이터 생성
 * - 고양이가 없으면 1마리 생성
 * - 90일치 daily_records 생성
 * - 수분 섭취 기록 생성
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

    const petId = pets[0].id;
    const now = new Date();
    let recordsCreated = 0;

    // 2. 3개월(90일)치 daily_records 생성
    for (let i = 0; i < 90; i++) {
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
    for (let i = 0; i < 90; i++) {
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
            const amount = randomInt(10, 50);
            const type = Math.random() < 0.7 ? 'water' : 'wet_food'; // 70% 물, 30% 습식사료

            await db.runAsync(
                `INSERT INTO fluid_records (id, petId, date, type, amount, createdAt, userId)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [id, petId, dateStr, type, amount, timestamp, userId]
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
    await db.runAsync('DELETE FROM custom_metric_records');
    await db.runAsync('DELETE FROM pets');

    console.log('[TestData] All data cleared');
}

// 유틸리티 함수들
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
