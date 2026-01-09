import { GoogleAuth } from 'google-auth-library';

interface SubscriptionPurchase {
    kind: string;
    startTimeMillis: string;
    expiryTimeMillis: string;
    autoRenewing: boolean;
    priceCurrencyCode: string;
    priceAmountMicros: string;
    countryCode: string;
    developerPayload: string;
    paymentState: number;
    cancelReason?: number;
    orderId: string;
    linkedPurchaseToken?: string;
    purchaseType?: number;
    acknowledgementState: number;
}

interface VerificationResult {
    success: boolean;
    isActive: boolean;
    expiryTimeMillis?: string;
    autoRenewing?: boolean;
    orderId?: string;
    error?: string;
}

/**
 * Google Play Developer API를 사용한 구독 검증
 * https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.subscriptions
 */
export class GooglePlayVerifier {
    private auth: GoogleAuth | null = null;
    private accessToken: string | null = null;
    private tokenExpiryTime: number = 0;
    private packageName: string;

    constructor() {
        this.packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.myorok.app';

        const serviceAccountEmail = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL;
        const serviceAccountPrivateKey = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

        // Service Account가 설정되어 있으면 인증 초기화
        if (serviceAccountEmail && serviceAccountPrivateKey) {
            this.auth = new GoogleAuth({
                credentials: {
                    client_email: serviceAccountEmail,
                    private_key: serviceAccountPrivateKey,
                },
                scopes: ['https://www.googleapis.com/auth/androidpublisher'],
            });
            console.log('[GooglePlay] Verifier initialized with service account');
        } else {
            console.warn('[GooglePlay] Service account not configured, using mock verification');
        }
    }

    /**
     * Access Token 획득 (캐싱 포함)
     */
    private async getAccessToken(): Promise<string | null> {
        if (!this.auth) {
            return null;
        }

        // 캐시된 토큰이 유효하면 재사용
        if (this.accessToken && Date.now() < this.tokenExpiryTime - 60000) {
            return this.accessToken;
        }

        try {
            const client = await this.auth.getClient();
            const tokenResponse = await client.getAccessToken();
            this.accessToken = tokenResponse.token || null;
            // 토큰은 보통 1시간 유효
            this.tokenExpiryTime = Date.now() + 3600000;
            return this.accessToken;
        } catch (error) {
            console.error('[GooglePlay] Failed to get access token:', error);
            return null;
        }
    }

    /**
     * 구독 구매 검증
     * @param purchaseToken Google Play에서 발급한 purchase token
     * @param productId 구독 상품 ID (예: myorok_monthly_premium)
     */
    async verifySubscription(purchaseToken: string, productId: string): Promise<VerificationResult> {
        // Service Account가 없으면 Mock 검증
        if (!this.auth) {
            console.log('[GooglePlay] Mock verification for token:', purchaseToken.substring(0, 20) + '...');
            return {
                success: true,
                isActive: true,
                expiryTimeMillis: String(Date.now() + 30 * 24 * 60 * 60 * 1000),
                autoRenewing: true,
                orderId: 'mock_order_' + Date.now(),
            };
        }

        try {
            const accessToken = await this.getAccessToken();
            if (!accessToken) {
                return { success: false, isActive: false, error: 'Failed to get access token' };
            }

            const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${this.packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[GooglePlay] API error:', response.status, errorText);
                return {
                    success: false,
                    isActive: false,
                    error: `API error: ${response.status}`,
                };
            }

            const purchase = await response.json() as SubscriptionPurchase;

            // 구독이 활성 상태인지 확인
            const expiryTime = parseInt(purchase.expiryTimeMillis, 10);
            const isActive = expiryTime > Date.now();

            console.log('[GooglePlay] Verification result:', {
                orderId: purchase.orderId,
                isActive,
                expiryTime: new Date(expiryTime).toISOString(),
                autoRenewing: purchase.autoRenewing,
            });

            return {
                success: true,
                isActive,
                expiryTimeMillis: purchase.expiryTimeMillis,
                autoRenewing: purchase.autoRenewing,
                orderId: purchase.orderId,
            };
        } catch (error: unknown) {
            console.error('[GooglePlay] Verification error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                success: false,
                isActive: false,
                error: errorMessage,
            };
        }
    }
}

// Singleton instance
let verifierInstance: GooglePlayVerifier | null = null;

export function getGooglePlayVerifier(): GooglePlayVerifier {
    if (!verifierInstance) {
        verifierInstance = new GooglePlayVerifier();
    }
    return verifierInstance;
}
