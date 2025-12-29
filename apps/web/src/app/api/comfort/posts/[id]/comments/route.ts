import { NextRequest, NextResponse } from 'next/server';
import { getPostById, savePost, generateId, filterBadWords, getModelsAsync, canComment, generateNickname } from '@/lib/comfort';

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

        const post = await getPostById(id);

        if (!post) {
            return NextResponse.json(
                { success: false, error: { code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } },
                { status: 404 }
            );
        }

        // 차단한 사용자 목록 조회
        const { BlockedDeviceModel } = await getModelsAsync();
        const blockedEntries = await BlockedDeviceModel.find({ deviceId }).lean();
        // blockedEntry may have _id, so we cast or map carefully
        const blockedDeviceIds = blockedEntries.map((b: any) => b.blockedDeviceId);

        const comments = post.comments
            .filter((c: any) => !blockedDeviceIds.includes(c.deviceId))
            .map((c: any) => ({
                id: c.id || c._id?.toString(),
                deviceId: c.deviceId,
                content: c.content,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
                isOwner: c.deviceId === deviceId,
                displayId: generateNickname(c.deviceId),
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

        // 도배 방지 체크
        const commentStatus = await canComment(deviceId);
        if (!commentStatus.canComment) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'COMMENT_RATE_LIMITED',
                        message: commentStatus.reason || '잠시 후 다시 시도해주세요.',
                    },
                    waitSeconds: commentStatus.waitSeconds,
                },
                { status: 429 }
            );
        }

        const post = await getPostById(id);

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

        // Mongoose document array push
        post.comments.push(newComment);
        await savePost(post);

        return NextResponse.json({
            success: true,
            data: {
                comment: {
                    ...newComment,
                    isOwner: true,
                    displayId: generateNickname(deviceId),
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
