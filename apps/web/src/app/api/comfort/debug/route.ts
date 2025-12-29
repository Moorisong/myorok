import { NextRequest, NextResponse } from 'next/server';
import { dbConnect, getModels, generateNickname, generateId, filterBadWords } from '@/lib/comfort';
import { Post } from '@/lib/comfort';

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
        const { action, deviceId, hours } = body;

        await dbConnect();
        const { PostModel } = getModels();

        if (action === 'reset-cooldown') {
            // 해당 기기의 최근 게시글 시간을 24시간 전으로 돌림
            const lastPost = await PostModel.findOne({ deviceId }).sort({ createdAt: -1 });
            if (lastPost) {
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
                lastPost.createdAt = yesterday;
                await lastPost.save();
                return NextResponse.json({ success: true, message: '쿨타임이 리셋되었습니다.' });
            }
            return NextResponse.json({ success: true, message: '작성한 게시글이 없어 쿨타임 리셋이 필요하지 않습니다.' });
        }

        if (action === 'create-sample') {
            // 랜덤 닉네임, 욕설 포함 샘플 글 생성
            // 닉네임은 deviceId 해싱이므로 랜덤 deviceId 생성
            const randomDeviceId = `test-user-${Math.random().toString(36).substring(7)}`;
            const rawContent = generateSampleContent();
            // 서버 로직에서는 필터링을 거쳐서 저장됨 (실제 동작 시뮬레이션)
            const filteredContent = filterBadWords(rawContent);

            const newPost: Post = {
                id: generateId(),
                deviceId: randomDeviceId,
                content: filteredContent,
                emoji: '🧪',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                likes: [],
                comments: [],
                reportCount: 0,
                reportedBy: [],
                hidden: false,
            };

            await PostModel.create(newPost);
            return NextResponse.json({ success: true, message: '샘플 게시글이 생성되었습니다.', data: newPost });
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

        return NextResponse.json({ success: false, error: '알 수 없는 액션입니다.' }, { status: 400 });

    } catch (error) {
        console.error('Debug API Error:', error);
        return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
