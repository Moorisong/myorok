import { NextRequest, NextResponse } from 'next/server';
import { getComfortData, saveComfortData, generateId, filterBadWords } from '@/lib/comfort';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/comfort/posts/[id]/comments - 댓글 목록
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        const data = getComfortData();
        const post = data.posts.find(p => p.id === id);

        if (!post) {
            return NextResponse.json(
                { success: false, error: { code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } },
                { status: 404 }
            );
        }

        // 차단한 사용자 목록
        const blockedDeviceIds = data.blockedDevices
            .filter(b => b.deviceId === deviceId)
            .map(b => b.blockedDeviceId);

        const comments = post.comments
            .filter(c => !blockedDeviceIds.includes(c.deviceId))
            .map(c => ({
                ...c,
                isOwner: c.deviceId === deviceId,
                displayId: `Device-${c.deviceId.slice(-4).toUpperCase()}`,
            }));

        return NextResponse.json({
            success: true,
            data: { comments },
        });
    } catch (error) {
        console.error('댓글 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}

// POST /api/comfort/posts/[id]/comments - 댓글 작성
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { deviceId, content } = body;

        if (!deviceId || typeof deviceId !== 'string') {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_CONTENT', message: '내용을 입력해주세요.' } },
                { status: 400 }
            );
        }

        if (content.length > 300) {
            return NextResponse.json(
                { success: false, error: { code: 'CONTENT_TOO_LONG', message: '댓글은 300자를 초과할 수 없습니다.' } },
                { status: 400 }
            );
        }

        const data = getComfortData();
        const post = data.posts.find(p => p.id === id);

        if (!post) {
            return NextResponse.json(
                { success: false, error: { code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } },
                { status: 404 }
            );
        }

        const now = new Date().toISOString();
        const filteredContent = filterBadWords(content.trim());

        const newComment = {
            id: generateId(),
            deviceId,
            content: filteredContent,
            createdAt: now,
            updatedAt: now,
        };

        post.comments.push(newComment);
        saveComfortData(data);

        return NextResponse.json({
            success: true,
            data: {
                comment: {
                    ...newComment,
                    isOwner: true,
                    displayId: `Device-${deviceId.slice(-4).toUpperCase()}`,
                },
            },
        });
    } catch (error) {
        console.error('댓글 작성 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
