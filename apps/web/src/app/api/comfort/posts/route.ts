import { NextRequest, NextResponse } from 'next/server';
import {
    getFilteredPosts,
    createPost,
    cleanupOldPosts,
    canPost,
    generateId,
    filterBadWords,
    generateNickname,
    type Post,
} from '@/lib/comfort';

export const dynamic = 'force-dynamic';

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

        // 자정 지난 글 삭제 (Async)
        await cleanupOldPosts();

        // MongoDB에서 차단/숨김 처리된 필터링된 목록 조회 (Async)
        // sort 파라미터 처리 (latest | cheer | comment)
        const sort = searchParams.get('sort') as 'latest' | 'cheer' | 'comment' | null;
        const validSort = (sort === 'latest' || sort === 'cheer' || sort === 'comment') ? sort : 'latest';

        const posts = await getFilteredPosts(deviceId, validSort);

        // View용 데이터 가공 (isOwner, isLiked 등)
        const formattedPosts = posts.map(post => ({
            ...post,
            isOwner: post.deviceId === deviceId,
            isLiked: post.likes.includes(deviceId),
            likeCount: post.likes.length,
            commentCount: post.comments.length,
            displayId: generateNickname(post.deviceId),
        }));
        // .sort()는 getFilteredPosts 내부에서 이미 createdAt -1 정렬됨

        // 글 작성 가능 여부 (Async)
        const postStatus = await canPost(deviceId);

        return NextResponse.json({
            success: true,
            data: {
                posts: formattedPosts,
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
        const { deviceId, content, emoji } = body;

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

        // 1시간 제한 체크 (Async) - skipCooldown이 true면 스킵
        const skipCooldown = body.skipCooldown === true;
        if (!skipCooldown) {
            const postStatus = await canPost(deviceId);
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
        }

        const now = new Date().toISOString();

        // 욕설 필터 적용
        const filteredContent = filterBadWords(content.trim());

        const newPost: Post = {
            id: generateId(),
            deviceId,
            content: filteredContent,
            emoji: emoji || '🐱',
            createdAt: now,
            updatedAt: now,
            likes: [],
            comments: [],
            reportCount: 0,
            reportedBy: [],
            hidden: false,
            cheerCount: 0,
        };

        // 데이터베이스 저장 (Async)
        await createPost(newPost);

        return NextResponse.json({
            success: true,
            data: {
                post: {
                    ...newPost,
                    isOwner: true,
                    isLiked: false,
                    likeCount: 0,
                    commentCount: 0,
                    cheerCount: 0,
                    displayId: generateNickname(deviceId),
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
