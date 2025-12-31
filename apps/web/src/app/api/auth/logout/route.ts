import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

interface JwtPayload {
    userId: string;
    nickname: string;
    iat: number;
    exp: number;
}

export async function POST(request: NextRequest) {
    try {
        // Get JWT token from Authorization header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No authorization token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!JWT_SECRET) {
            console.error('JWT_SECRET is not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // Verify JWT token
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

            // Token is valid, proceed with logout
            // Note: With JWT, logout is typically handled client-side by removing the token
            // Server-side logout would require a token blacklist/revocation system

            return NextResponse.json({
                success: true,
                message: 'Successfully logged out',
            });
        } catch (jwtError) {
            // Token is invalid or expired
            if (jwtError instanceof jwt.TokenExpiredError) {
                return NextResponse.json(
                    { error: 'Token has expired' },
                    { status: 401 }
                );
            } else if (jwtError instanceof jwt.JsonWebTokenError) {
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 401 }
                );
            }
            throw jwtError;
        }

    } catch (error) {
        console.error('Error during logout:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
