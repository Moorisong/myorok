import { NextRequest, NextResponse } from 'next/server';
import { getPostById, savePost } from '@/lib/comfort';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/comfort/posts/[id]/like - 좋아요 토글
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { deviceId } = body;

        if (!deviceId || typeof deviceId !== 'string') {
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

        const likeIndex = post.likes.indexOf(deviceId);
        let isLiked: boolean;

        if (likeIndex === -1) {
            // 좋아요 추가
            post.likes.push(deviceId);
            isLiked = true;
        } else {
            // 좋아요 취소
            post.likes.splice(likeIndex, 1);
            isLiked = false;
        }

        await savePost(post);

        return NextResponse.json({
            success: true,
            data: {
                isLiked,
                likeCount: post.likes.length,
            },
        });
    } catch (error) {
        console.error('좋아요 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
