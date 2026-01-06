import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isAdminUser } from '../../../../lib/admin';

export const dynamic = 'force-dynamic';

interface KakaoTokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    refresh_token_expires_in: number;
}

interface KakaoAccount {
    profile?: {
        nickname?: string;
        profile_image_url?: string;
        thumbnail_image_url?: string;
    };
}

interface KakaoUserResponse {
    id: number;
    connected_at: string;
    kakao_account?: KakaoAccount;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { error: 'Authorization code is required' },
                { status: 400 }
            );
        }

        // Validate environment variables
        const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
        const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
        const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || 'https://myorok.haroo.site/auth/kakao';
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!KAKAO_REST_API_KEY || !KAKAO_CLIENT_SECRET || !JWT_SECRET) {
            console.error('Missing required environment variables');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Exchange authorization code for access token
        const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: KAKAO_REST_API_KEY,
            client_secret: KAKAO_CLIENT_SECRET,
            redirect_uri: KAKAO_REDIRECT_URI,
            code: code,
        });

        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenParams.toString(),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Kakao token exchange failed:', errorText);
            return NextResponse.json(
                { error: 'Failed to exchange authorization code for token' },
                { status: 401 }
            );
        }

        const tokenData: KakaoTokenResponse = await tokenResponse.json();

        // Fetch user information
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            },
        });

        if (!userResponse.ok) {
            const errorText = await userResponse.text();
            console.error('Kakao user info fetch failed:', errorText);
            return NextResponse.json(
                { error: 'Failed to fetch user information' },
                { status: 401 }
            );
        }

        const userData: KakaoUserResponse = await userResponse.json();

        // Extract user information
        const user = {
            id: userData.id.toString(),
            nickname: userData.kakao_account?.profile?.nickname || 'Unknown User',
            profileImage: userData.kakao_account?.profile?.profile_image_url ||
                userData.kakao_account?.profile?.thumbnail_image_url || '',
        };

        // Generate JWT token (30 days expiration)
        const jwtToken = jwt.sign(
            {
                userId: user.id,
                nickname: user.nickname,
            },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Check if user is admin
        const isAdmin = isAdminUser(user.id);

        // Add isAdmin to user object for Deep Link
        const userWithAdmin = {
            ...user,
            isAdmin
        };

        return NextResponse.json({
            success: true,
            user: userWithAdmin,
            token: jwtToken,
            isAdmin,
        });

    } catch (error) {
        console.error('Error during Kakao authentication:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
