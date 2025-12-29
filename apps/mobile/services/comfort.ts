import { CONFIG } from '../constants';
import { getDeviceId } from './pin';

// 타입 정의
export interface ComfortPost {
    id: string;
    deviceId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    isOwner: boolean;
    isLiked: boolean;
    likeCount: number;
    commentCount: number;
    displayId: string;
    comments?: ComfortComment[];
}

export interface ComfortComment {
    id: string;
    deviceId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    isOwner: boolean;
    displayId: string;
}

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
    waitMinutes?: number;
}

interface PostsResponse {
    posts: ComfortPost[];
    canPost: boolean;
    waitMinutes?: number;
}

// API 호출 함수
async function apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        return await response.json();
    } catch {
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: '서버에 연결할 수 없습니다.',
            },
        };
    }
}

// 게시글 목록 조회
export async function getPosts(): Promise<ApiResponse<PostsResponse>> {
    const deviceId = await getDeviceId();
    return apiCall<PostsResponse>(`/api/comfort/posts?deviceId=${encodeURIComponent(deviceId)}`);
}

// 게시글 작성
export async function createPost(content: string, skipCooldown = false): Promise<ApiResponse<{ post: ComfortPost }>> {
    const deviceId = await getDeviceId();
    return apiCall('/api/comfort/posts', {
        method: 'POST',
        body: JSON.stringify({ deviceId, content, skipCooldown }),
    });
}

// 게시글 수정
export async function updatePost(postId: string, content: string): Promise<ApiResponse<{ post: ComfortPost }>> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/comfort/posts/${postId}`, {
        method: 'PUT',
        body: JSON.stringify({ deviceId, content }),
    });
}

// 게시글 삭제
export async function deletePost(postId: string): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/comfort/posts/${postId}?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
    });
}

// 좋아요 토글
export async function toggleLike(postId: string): Promise<ApiResponse<{ isLiked: boolean; likeCount: number }>> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/comfort/posts/${postId}/like`, {
        method: 'POST',
        body: JSON.stringify({ deviceId }),
    });
}

// 댓글 목록 조회
export async function getComments(postId: string): Promise<ApiResponse<{ comments: ComfortComment[] }>> {
    const deviceId = await getDeviceId();
    return apiCall<{ comments: ComfortComment[] }>(
        `/api/comfort/posts/${postId}/comments?deviceId=${encodeURIComponent(deviceId)}`
    );
}

// 댓글 작성
export async function createComment(postId: string, content: string): Promise<ApiResponse<{ comment: ComfortComment }>> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/comfort/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ deviceId, content }),
    });
}

// 댓글 수정
export async function updateComment(commentId: string, content: string): Promise<ApiResponse<{ comment: ComfortComment }>> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/comfort/comments/${commentId}`, {
        method: 'PUT',
        body: JSON.stringify({ deviceId, content }),
    });
}

// 댓글 삭제
export async function deleteComment(commentId: string): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/comfort/comments/${commentId}?deviceId=${encodeURIComponent(deviceId)}`, {
        method: 'DELETE',
    });
}

// 게시글 신고
export async function reportPost(postId: string, reason: string): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall('/api/comfort/report', {
        method: 'POST',
        body: JSON.stringify({ deviceId, targetId: postId, targetType: 'post', reason }),
    });
}

// 사용자 차단
export async function blockUser(blockedDeviceId: string): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall('/api/comfort/block', {
        method: 'POST',
        body: JSON.stringify({ deviceId, blockedDeviceId }),
    });
}

// 차단 해제
export async function unblockUser(blockedDeviceId: string): Promise<ApiResponse> {
    const deviceId = await getDeviceId();
    return apiCall(
        `/api/comfort/block?deviceId=${encodeURIComponent(deviceId)}&blockedDeviceId=${encodeURIComponent(blockedDeviceId)}`,
        { method: 'DELETE' }
    );
}

// 차단 목록 조회
export async function getBlockedUsers(): Promise<ApiResponse<{ blockedDevices: { blockedDeviceId: string; displayId: string; createdAt: string }[] }>> {
    const deviceId = await getDeviceId();
    return apiCall(`/api/comfort/block?deviceId=${encodeURIComponent(deviceId)}`);
}
