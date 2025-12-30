import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getModels, generateNickname, generateId, filterBadWords } from '@/lib/comfort';
import { Post } from '@/lib/comfort';

import NotificationState from '@/models/NotificationState';
import Device from '@/models/Device';
import { sendPushNotification } from '@/lib/notification';
// ... (keep existing code)


// 욕설 샘플 목록
const BAD_WORDS_SAMPLES = [
    '씨발', '개새끼', '존나', '미친', '병신',
    '죽어', '꺼져', '닥쳐', '멍청이', '쓰레기'
];

const NORMAL_WORDS_SAMPLES = [
    '안녕하세요', '오늘 날씨가 좋네요', '힘내세요', '화이팅',
    '사랑합니다', '행복하세요', '좋은 하루', '맛있는 점심',
    '피곤하네요', '졸려요'
];

function generateSampleContent() {
    let content = '';
    const length = Math.floor(Math.random() * 50) + 50; // 50~100 words

    for (let i = 0; i < length; i++) {
        const isBad = Math.random() < 0.3; // 30% chance of bad word
        if (isBad) {
            content += BAD_WORDS_SAMPLES[Math.floor(Math.random() * BAD_WORDS_SAMPLES.length)] + ' ';
        } else {
            content += NORMAL_WORDS_SAMPLES[Math.floor(Math.random() * NORMAL_WORDS_SAMPLES.length)] + ' ';
        }
    }
    return content.trim();
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        let { action } = body;
        const { deviceId, hours } = body;
        action = action?.trim();
        console.log(`[DebugAPI] Received action: '${action}'`, body);

        await dbConnect();
        const { PostModel } = getModels();

        if (action === 'reset-cooldown') {
            // 해당 기기의 최근 게시글 시간을 24시간 전으로 돌림
            const lastPost = await PostModel.findOne({ deviceId }).sort({ createdAt: -1 });
            if (lastPost) {
                // 쿨타임(1시간)만 해제되도록 1시간 5분 전으로 설정 (자정 삭제 방지)
                const oneHourFiveMinAgo = new Date(Date.now() - 65 * 60 * 1000).toISOString();
                lastPost.createdAt = oneHourFiveMinAgo;
                await lastPost.save();
                return NextResponse.json({ success: true, message: '쿨타임이 리셋되었습니다.' });
            }
            return NextResponse.json({ success: true, message: '작성한 게시글이 없어 쿨타임 리셋이 필요하지 않습니다.' });
        }

        if (action === 'create-sample') {
            // 랜덤 닉네임, 욕설 포함 샘플 글 생성
            const count = body.count || 1;
            const sameUser = body.sameUser || false;

            // 동일 유저 옵션일 경우 하나의 deviceId 생성, 아니면 null (루프 안에서 생성)
            const fixedDeviceId = sameUser ? `test-user-${Math.random().toString(36).substring(7)}` : null;

            const createdPosts: Post[] = [];

            for (let i = 0; i < count; i++) {
                // 닉네임은 deviceId 해싱이므로 랜덤 deviceId 생성
                const deviceId = fixedDeviceId || `test-user-${Math.random().toString(36).substring(7)}`;
                const rawContent = generateSampleContent();
                // 서버 로직에서는 필터링을 거쳐서 저장됨 (실제 동작 시뮬레이션)
                const filteredContent = filterBadWords(rawContent);

                const newPost: Post = {
                    id: generateId(),
                    deviceId: deviceId,
                    content: filteredContent,
                    emoji: '🧪',
                    // 생성 시간 차이를 약간 둠 (정렬 테스트 용이)
                    createdAt: new Date(Date.now() - i * 1000).toISOString(),
                    updatedAt: new Date(Date.now() - i * 1000).toISOString(),
                    likes: [],
                    comments: [],
                    reportCount: 0,
                    reportedBy: [],
                    hidden: false,
                };
                createdPosts.push(newPost);
            }

            // insertMany로 한 번에 저장
            await PostModel.insertMany(createdPosts);
            return NextResponse.json({ success: true, message: `${count}개의 샘플 게시글이 생성되었습니다.`, data: createdPosts });
        }

        if (action === 'time-travel') {
            // 시간 이동 (최근 게시글 시간을 N시간 전으로 이동)
            if (!hours) {
                return NextResponse.json({ success: false, error: '시간을 입력해주세요.' }, { status: 400 });
            }

            const lastPost = await PostModel.findOne({ deviceId }).sort({ createdAt: -1 });
            if (lastPost) {
                const pastTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
                lastPost.createdAt = pastTime;
                await lastPost.save();
                return NextResponse.json({ success: true, message: `${hours}시간 전으로 이동했습니다.` });
            }
            return NextResponse.json({ success: false, error: '작성한 게시글이 없습니다.' }, { status: 404 });
        }

        if (action === 'reset-time') {
            // 작성 시간을 현재로 리셋 (쿨타임 다시 적용)
            const lastPost = await PostModel.findOne({ deviceId }).sort({ createdAt: -1 });
            if (lastPost) {
                lastPost.createdAt = new Date().toISOString();
                await lastPost.save();
                return NextResponse.json({ success: true, message: '작성 시간이 현재로 리셋되었습니다. (쿨타임 적용)' });
            }
            return NextResponse.json({ success: false, error: '작성한 게시글이 없습니다.' }, { status: 404 });
        }

        if (action === 'get-notification-state') {
            const { type } = body;
            const state = await NotificationState.findOne({ deviceId, type });
            return NextResponse.json({ success: true, state });
        }

        if (action === 'set-notification-state') {
            const { type, lastSentAt, unreadCount } = body;
            const updateData: any = {};
            if (lastSentAt !== undefined) updateData.lastSentAt = lastSentAt;
            if (unreadCount !== undefined) updateData.unreadCount = unreadCount;

            const state = await NotificationState.findOneAndUpdate(
                { deviceId, type },
                { $set: updateData },
                { upsert: true, new: true }
            );
            return NextResponse.json({ success: true, state });
        }

        if (action === 'register-dummy-device') {
            const { deviceId } = body;
            if (!deviceId) {
                return NextResponse.json({ success: false, error: 'Device ID is missing' }, { status: 400 });
            }

            try {
                const dummyToken = `ExponentPushToken[dummy-${deviceId}]`;

                await Device.findOneAndUpdate(
                    { deviceId },
                    {
                        $set: {
                            pushToken: dummyToken,
                            updatedAt: new Date()
                        },
                        $setOnInsert: { createdAt: new Date() }
                    },
                    { upsert: true, new: true }
                );

                console.log(`[DebugAPI] Registered dummy device: ${deviceId} -> ${dummyToken}`);
                return NextResponse.json({ success: true, message: '가짜 기기가 등록되었습니다.', token: dummyToken });
            } catch (err) {
                console.error('[DebugAPI] Registration error:', err);
                return NextResponse.json({ success: false, error: `DB Error: ${(err as any).message}` }, { status: 500 });
            }
        }

        if (action === 'simulate-push') {
            const { type, title, body: pushBody, options } = body;
            const result = await sendPushNotification(deviceId, title, pushBody, { type }, options);
            // Fetch updated state to return
            const state = await NotificationState.findOne({ deviceId, type });
            return NextResponse.json({ success: true, state, pushResult: result });
        }

        return NextResponse.json({ success: false, error: '알 수 없는 액션입니다.' }, { status: 400 });

    } catch (error) {
        console.error('Debug API Error:', error);
        return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
