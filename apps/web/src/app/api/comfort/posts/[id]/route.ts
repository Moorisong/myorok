import { NextRequest, NextResponse } from 'next/server';
import { getPostById, savePost, filterBadWords, getModelsAsync, generateNickname } from '@/lib/comfort';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/comfort/posts/[id] - 게시글 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

        if (content.length > 500) {
            return NextResponse.json(
                { success: false, error: { code: 'CONTENT_TOO_LONG', message: '내용은 500자를 초과할 수 없습니다.' } },
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

        if (post.deviceId !== deviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: '수정 권한이 없습니다.' } },
                { status: 403 }
            );
        }

        // 욕설 필터 적용
        post.content = filterBadWords(content.trim());
        post.updatedAt = new Date().toISOString();

        await savePost(post);

        return NextResponse.json({
            success: true,
            data: {
                post: {
                    ...post,
                    isOwner: true,
                    isLiked: post.likes.includes(deviceId),
                    likeCount: post.likes.length,
                    commentCount: post.comments.length,
                    displayId: generateNickname(deviceId),
                },
            },
        });
    } catch (error) {
        console.error('게시글 수정 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}

// DELETE /api/comfort/posts/[id] - 게시글 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

        if (post.deviceId !== deviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: '삭제 권한이 없습니다.' } },
                { status: 403 }
            );
        }

        // 삭제 (Mongoose deleteOne)
        const { PostModel } = await getModelsAsync();
        await PostModel.deleteOne({ id });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('게시글 삭제 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
