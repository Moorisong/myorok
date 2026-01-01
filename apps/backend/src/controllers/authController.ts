import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { config } from '../config';
import { AuthRequest } from '../middleware/authMiddleware';

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
  refresh_token_expires_in: number;
}

interface KakaoUserInfo {
  id: number;
  connected_at?: string;
  properties?: {
    nickname?: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account?: {
    profile?: {
      nickname?: string;
      profile_image_url?: string;
      thumbnail_image_url?: string;
    };
  };
}

export const kakaoLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Authorization code is required',
      });
      return;
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.kakao.restApiKey,
        client_secret: config.kakao.clientSecret,
        redirect_uri: config.kakao.redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Kakao token exchange failed:', errorData);
      res.status(400).json({
        success: false,
        error: 'Failed to exchange authorization code for token',
      });
      return;
    }

    const tokenData = (await tokenResponse.json()) as KakaoTokenResponse;
    const { access_token } = tokenData;

    // Fetch user information from Kakao
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text();
      console.error('Kakao user info fetch failed:', errorData);
      res.status(400).json({
        success: false,
        error: 'Failed to fetch user information from Kakao',
      });
      return;
    }

    const userInfo = (await userInfoResponse.json()) as KakaoUserInfo;

    // Extract user details
    const userId = userInfo.id.toString();
    const nickname =
      userInfo.kakao_account?.profile?.nickname ||
      userInfo.properties?.nickname ||
      'Unknown';
    const profileImage =
      userInfo.kakao_account?.profile?.profile_image_url ||
      userInfo.properties?.profile_image ||
      '';

    // Generate JWT token
    const token = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: '30d',
    });

    // Return user data and token
    res.status(200).json({
      success: true,
      user: {
        id: userId,
        nickname,
        profileImage,
      },
      token,
    });
  } catch (error) {
    console.error('Kakao login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Kakao OAuth callback - handles GET redirect from Kakao (browser flow)
 * Displays styled HTML success/error pages
 */
export const kakaoCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code, error, error_description } = req.query;

    // Handle OAuth error from Kakao
    if (error) {
      console.error('Kakao OAuth error:', error, error_description);
      res.redirect(`/views/auth-error.html?error=${error}&message=${encodeURIComponent(String(error_description || '카카오 로그인 중 오류가 발생했습니다.'))}`);
      return;
    }

    if (!code || typeof code !== 'string') {
      res.redirect('/views/auth-error.html?error=NO_CODE&message=' + encodeURIComponent('인증 코드를 받지 못했습니다.'));
      return;
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.kakao.restApiKey,
        client_secret: config.kakao.clientSecret,
        redirect_uri: config.kakao.redirectUri,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Kakao token exchange failed:', errorData);
      res.redirect('/views/auth-error.html?error=TOKEN_EXCHANGE&message=' + encodeURIComponent('토큰 교환에 실패했습니다.'));
      return;
    }

    const tokenData = (await tokenResponse.json()) as KakaoTokenResponse;
    const { access_token } = tokenData;

    // Fetch user information from Kakao
    const userInfoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text();
      console.error('Kakao user info fetch failed:', errorData);
      res.redirect('/views/auth-error.html?error=USER_INFO&message=' + encodeURIComponent('사용자 정보를 가져오는데 실패했습니다.'));
      return;
    }

    const userInfo = (await userInfoResponse.json()) as KakaoUserInfo;
    const userId = userInfo.id.toString();

    // Generate JWT token
    const token = jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: '30d',
    });

    // Redirect to success page with token in URL (for app to capture)
    // The app will use deep linking to receive this
    res.redirect(`/views/auth-success.html?token=${token}&userId=${userId}`);
  } catch (error) {
    console.error('Kakao callback error:', error);
    res.redirect('/views/auth-error.html?error=INTERNAL&message=' + encodeURIComponent('서버 오류가 발생했습니다.'));
  }
};

export const logout = async (
  _req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // JWT is stateless, so we just verify the token exists
    // The client should delete the token on their end
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};
