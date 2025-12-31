import { NextRequest, NextResponse } from 'next/server';
import { getPostById, savePost } from '@/lib/comfort';

export const dynamic = 'force-dynamic';

const REPORT_THRESHOLD = 3; // 3회 이상 신고 시 자동 숨김

// POST /api/comfort/report - 신고
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { deviceId, targetId, targetType, reason } = body;

        if (!deviceId || typeof deviceId !== 'string') {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        if (!targetId || !targetType || !['post', 'comment'].includes(targetType)) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_TARGET', message: '신고 대상이 유효하지 않습니다.' } },
                { status: 400 }
            );
        }

        if (targetType === 'post') {
            const post = await getPostById(targetId);
            if (!post) {
                return NextResponse.json(
                    { success: false, error: { code: 'POST_NOT_FOUND', message: '게시글을 찾을 수 없습니다.' } },
                    { status: 404 }
                );
            }

            // 이미 신고했는지 확인
            if (post.reportedBy.includes(deviceId)) {
                return NextResponse.json(
                    { success: false, error: { code: 'ALREADY_REPORTED', message: '이미 신고한 게시글입니다.' } },
                    { status: 400 }
                );
            }

            // 자기 글은 신고 불가
            if (post.deviceId === deviceId) {
                return NextResponse.json(
                    { success: false, error: { code: 'SELF_REPORT', message: '자신의 게시글은 신고할 수 없습니다.' } },
                    { status: 400 }
                );
            }

            post.reportedBy.push(deviceId);
            post.reportCount = post.reportedBy.length;

            // 3회 이상 신고 시 자동 숨김
            if (post.reportCount >= REPORT_THRESHOLD) {
                post.hidden = true;
            }

            await savePost(post);

            return NextResponse.json({
                success: true,
                data: { reportCount: post.reportCount, hidden: post.hidden },
            });
        }

        // 댓글 신고는 현재 미구현 (게시글과 동일 패턴으로 확장 가능)
        return NextResponse.json(
            { success: false, error: { code: 'NOT_IMPLEMENTED', message: '댓글 신고는 준비 중입니다.' } },
            { status: 501 }
        );
    } catch (error) {
        console.error('신고 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
