import { NextRequest, NextResponse } from 'next/server';
import { getPostById, savePost, generateId, filterBadWords, getModelsAsync, canComment, generateNickname } from '@/lib/comfort';
import { sendPushNotification } from '@/lib/notification';
import dbConnect from '@/lib/mongodb';
import Device from '@/models/Device';

export const dynamic = 'force-dynamic';

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
            .filter((c: any) => !blockedDeviceIds.includes(c.deviceId) && !c.hidden)
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

        // 디바이스 등록 (푸시 알림을 위해)
        try {
            await dbConnect();
            await Device.findOneAndUpdate(
                { deviceId },
                {
                    $set: { updatedAt: new Date() },
                    $setOnInsert: {
                        settings: {
                            marketing: true,
                            comments: true,
                            inactivity: true,
                        }
                    }
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('[Comment] Failed to register device:', error);
            // 디바이스 등록 실패해도 댓글은 작성됨
        }

        // 푸시 알림 전송 (본인 글이 아닐 경우)
        if (post.deviceId !== deviceId) {
            try {
                await sendPushNotification(
                    post.deviceId,
                    '새 댓글이 달렸어요 💬',
                    '짧은 시간에 댓글이 많을 경우, 알림은 한 번만 보내드려요.',
                    { type: 'COMMENT', postId: id, commentId: newComment.id },
                    {
                        cooldownMs: 3 * 60 * 60 * 1000,
                        type: 'COMFORT_COMMENT',
                        notificationCategory: 'comments'
                    }
                );
            } catch (err) {
                console.error('[Comment] Push notification failed:', err);
            }
        }

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
