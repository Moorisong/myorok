import { NextRequest, NextResponse } from 'next/server';
import {
    getComfortData,
    saveComfortData,
    cleanupOldPosts,
    canPost,
    generateId,
    filterBadWords,
    type Post,
} from '@/lib/comfort';

// GET /api/comfort/posts - 게시글 목록 조회
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const deviceId = searchParams.get('deviceId');

        if (!deviceId) {
            return NextResponse.json(
                { success: false, error: { code: 'INVALID_DEVICE_ID', message: '유효하지 않은 기기 ID입니다.' } },
                { status: 400 }
            );
        }

        // 자정 지난 글 삭제
        cleanupOldPosts();

        const data = getComfortData();

        // 차단한 사용자 목록
        const blockedDeviceIds = data.blockedDevices
            .filter(b => b.deviceId === deviceId)
            .map(b => b.blockedDeviceId);

        // 필터링: 차단된 사용자 글, 숨김 처리된 글 제외
        const posts = data.posts
            .filter(post => !post.hidden)
            .filter(post => !blockedDeviceIds.includes(post.deviceId))
            .map(post => ({
                ...post,
                // 댓글에서도 차단된 사용자 제외
                comments: post.comments.filter(c => !blockedDeviceIds.includes(c.deviceId)),
                isOwner: post.deviceId === deviceId,
                isLiked: post.likes.includes(deviceId),
                likeCount: post.likes.length,
                commentCount: post.comments.length,
                displayId: `Device-${post.deviceId.slice(-4).toUpperCase()}`,
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // 글 작성 가능 여부
        const postStatus = canPost(deviceId);

        return NextResponse.json({
            success: true,
            data: {
                posts,
                canPost: postStatus.canPost,
                waitMinutes: postStatus.waitMinutes,
            },
        });
    } catch (error) {
        console.error('게시글 조회 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}

// POST /api/comfort/posts - 게시글 작성
export async function POST(request: NextRequest) {
    try {
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

        // 1시간 제한 체크
        const postStatus = canPost(deviceId);
        if (!postStatus.canPost) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'POST_LIMIT',
                        message: `${postStatus.waitMinutes}분 후에 글을 작성할 수 있습니다.`
                    },
                    waitMinutes: postStatus.waitMinutes,
                },
                { status: 429 }
            );
        }

        const data = getComfortData();
        const now = new Date().toISOString();

        // 욕설 필터 적용
        const filteredContent = filterBadWords(content.trim());

        const newPost: Post = {
            id: generateId(),
            deviceId,
            content: filteredContent,
            createdAt: now,
            updatedAt: now,
            likes: [],
            comments: [],
            reportCount: 0,
            reportedBy: [],
            hidden: false,
        };

        data.posts.push(newPost);
        data.lastPostTime[deviceId] = now;

        saveComfortData(data);

        return NextResponse.json({
            success: true,
            data: {
                post: {
                    ...newPost,
                    isOwner: true,
                    isLiked: false,
                    likeCount: 0,
                    commentCount: 0,
                    displayId: `Device-${deviceId.slice(-4).toUpperCase()}`,
                },
            },
        });
    } catch (error) {
        console.error('게시글 작성 오류:', error);
        return NextResponse.json(
            { success: false, error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } },
            { status: 500 }
        );
    }
}
