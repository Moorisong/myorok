import { NextRequest, NextResponse } from 'next/server';
import { getComfortData, saveComfortData, filterBadWords } from '@/lib/comfort';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/comfort/comments/[id] - 댓글 수정
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

        if (content.length > 300) {
            return NextResponse.json(
                { success: false, error: { code: 'CONTENT_TOO_LONG', message: '댓글은 300자를 초과할 수 없습니다.' } },
                { status: 400 }
            );
        }

        const data = getComfortData();

        // 모든 게시글에서 댓글 찾기
        for (const post of data.posts) {
            const commentIndex = post.comments.findIndex(c => c.id === id);
            if (commentIndex !== -1) {
                const comment = post.comments[commentIndex];

                if (comment.deviceId !== deviceId) {
                    return NextResponse.json(
                        { success: false, error: { code: 'FORBIDDEN', message: '수정 권한이 없습니다.' } },
                        { status: 403 }
                    );
                }

                comment.content = filterBadWords(content.trim());
                comment.updatedAt = new Date().toISOString();
                saveComfortData(data);

                return NextResponse.json({
                    success: true,
                    data: { comment },
                });
            }
        }

        return NextResponse.json(
            { success: false, error: { code: 'COMMENT_NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
            { status: 404 }
        );
    } catch (error) {
        console.error('댓글 수정 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}

// DELETE /api/comfort/comments/[id] - 댓글 삭제
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

        const data = getComfortData();

        for (const post of data.posts) {
            const commentIndex = post.comments.findIndex(c => c.id === id);
            if (commentIndex !== -1) {
                const comment = post.comments[commentIndex];

                if (comment.deviceId !== deviceId) {
                    return NextResponse.json(
                        { success: false, error: { code: 'FORBIDDEN', message: '삭제 권한이 없습니다.' } },
                        { status: 403 }
                    );
                }

                post.comments.splice(commentIndex, 1);
                saveComfortData(data);

                return NextResponse.json({ success: true });
            }
        }

        return NextResponse.json(
            { success: false, error: { code: 'COMMENT_NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
            { status: 404 }
        );
    } catch (error) {
        console.error('댓글 삭제 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
