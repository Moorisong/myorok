import { NextRequest, NextResponse } from 'next/server';
import { getModelsAsync } from '@/lib/comfort';

export const dynamic = 'force-dynamic';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/comfort/comments/[id]/report - 댓글 신고
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { id: commentId } = await params;
        const body = await request.json();
        const { deviceId, reason } = body;

        // deviceId 검증
        if (!deviceId || typeof deviceId !== 'string') {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        // 댓글이 포함된 게시글 찾기
        const { PostModel } = await getModelsAsync();
        const post = await PostModel.findOne({ 'comments.id': commentId });

        if (!post) {
            return NextResponse.json(
                { success: false, error: { code: 'COMMENT_NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
                { status: 404 }
            );
        }

        // 해당 댓글 찾기
        const comment = post.comments.find((c: any) => c.id === commentId);

        if (!comment) {
            return NextResponse.json(
                { success: false, error: { code: 'COMMENT_NOT_FOUND', message: '댓글을 찾을 수 없습니다.' } },
                { status: 404 }
            );
        }

        // 중복 신고 체크
        if (comment.reportedBy && comment.reportedBy.includes(deviceId)) {
            return NextResponse.json(
                { success: false, error: { code: 'ALREADY_REPORTED', message: '이미 신고한 댓글입니다.' } },
                { status: 409 }
            );
        }

        // 신고 정보 업데이트
        if (!comment.reportedBy) {
            comment.reportedBy = [];
        }
        if (!comment.reportCount) {
            comment.reportCount = 0;
        }

        comment.reportedBy.push(deviceId);
        comment.reportCount += 1;

        // 3회 이상 신고 시 자동 숨김
        if (comment.reportCount >= 3) {
            comment.hidden = true;
        }

        // 변경사항 저장
        await post.save();

        return NextResponse.json({
            success: true,
            data: {
                reportCount: comment.reportCount,
                hidden: comment.hidden,
            },
        });
    } catch (error) {
        console.error('댓글 신고 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
