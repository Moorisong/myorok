/**
 * Device 모델 마이그레이션 스크립트
 * 기존 Device 문서에 createdAt 필드 추가
 */

import dbConnect from '../lib/mongodb';
import Device from '../models/Device';

async function migrateDevices() {
    try {
        console.log('🔄 MongoDB 연결 중...');
        await dbConnect();

        console.log('🔍 createdAt 필드가 없는 Device 문서 검색 중...');
        const devicesWithoutCreatedAt = await Device.find({
            createdAt: { $exists: false }
        });

        console.log(`📊 총 ${devicesWithoutCreatedAt.length}개의 문서를 마이그레이션합니다.`);

        if (devicesWithoutCreatedAt.length === 0) {
            console.log('✅ 마이그레이션이 필요한 문서가 없습니다.');
            process.exit(0);
        }

        let updated = 0;
        for (const device of devicesWithoutCreatedAt) {
            await Device.updateOne(
                { _id: device._id },
                {
                    $set: {
                        createdAt: device.updatedAt || new Date()
                    }
                }
            );
            updated++;

            if (updated % 10 === 0) {
                console.log(`   진행 중... ${updated}/${devicesWithoutCreatedAt.length}`);
            }
        }

        console.log(`✅ 마이그레이션 완료! ${updated}개의 문서를 업데이트했습니다.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ 마이그레이션 실패:', error);
        process.exit(1);
    }
}

migrateDevices();
