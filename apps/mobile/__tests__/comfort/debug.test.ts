import { debugAction } from '../../services/comfort';
import * as deviceService from '../../services/device';
import { CONFIG } from '../../constants';

// Mock getDeviceId
jest.mock('../../services/device', () => ({
    getDeviceId: jest.fn(),
}));

describe('Comfort Debug Service Actions', () => {
    const mockDeviceId = 'test-device-id-1234';
    let fetchMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        (deviceService.getDeviceId as jest.Mock).mockResolvedValue(mockDeviceId);
        
        // Mock global fetch
        fetchMock = jest.fn();
        global.fetch = fetchMock;
    });

    it('should retrieve deviceId correctly before making api calls', async () => {
        fetchMock.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue({ success: true, data: { message: 'Success' } }),
        });

        await debugAction('reset-cooldown');
        expect(deviceService.getDeviceId).toHaveBeenCalledTimes(1);
    });

    describe('Success Cases for All Debug Actions', () => {
        const testCases = [
            {
                name: 'add-test-comment (최신 글에 댓글 추가)',
                action: 'add-test-comment',
                params: {},
                expectedBody: { deviceId: mockDeviceId, action: 'add-test-comment' },
            },
            {
                name: 'reset-comment-cooldown (댓글 알림 쿨타임 초기화)',
                action: 'reset-comment-cooldown',
                params: {},
                expectedBody: { deviceId: mockDeviceId, action: 'reset-comment-cooldown' },
            },
            {
                name: 'reset-cooldown (글쓰기 쿨타임 리셋)',
                action: 'reset-cooldown',
                params: {},
                expectedBody: { deviceId: mockDeviceId, action: 'reset-cooldown' },
            },
            {
                name: 'create-sample (샘플 생성 x3)',
                action: 'create-sample',
                params: { count: 3 },
                expectedBody: { deviceId: mockDeviceId, action: 'create-sample', count: 3 },
            },
            {
                name: 'set-inactivity-3days (미활동 3일 상태 만들기)',
                action: 'set-inactivity-3days',
                params: {},
                expectedBody: { deviceId: mockDeviceId, action: 'set-inactivity-3days' },
            },
        ];

        testCases.forEach(({ name, action, params, expectedBody }) => {
            it(`should successfully execute ${name}`, async () => {
                const mockResponse = { success: true, data: { message: `${action} completed` } };
                fetchMock.mockResolvedValueOnce({
                    json: jest.fn().mockResolvedValue(mockResponse),
                });

                const result = await debugAction(action, params);

                expect(fetchMock).toHaveBeenCalledTimes(1);
                expect(fetchMock).toHaveBeenCalledWith(
                    `${CONFIG.API_BASE_URL}/api/comfort/debug`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(expectedBody),
                    }
                );
                expect(result).toEqual(mockResponse);
            });
        });
    });

    describe('Error & Failure Cases', () => {
        it('should handle API failure response correctly', async () => {
            const mockErrorResponse = {
                success: false,
                error: {
                    code: 'LIMIT_ERROR',
                    message: 'Cannot reset cooldown at this time.',
                },
            };
            fetchMock.mockResolvedValueOnce({
                json: jest.fn().mockResolvedValue(mockErrorResponse),
            });

            const result = await debugAction('reset-cooldown');
            expect(result).toEqual(mockErrorResponse);
        });

        it('should handle network/connection exceptions gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            fetchMock.mockRejectedValueOnce(new Error('Network disconnected'));

            const result = await debugAction('reset-cooldown');

            expect(result).toEqual({
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: '서버에 연결할 수 없습니다.',
                },
            });
            expect(consoleErrorSpy).toHaveBeenCalled();
            consoleErrorSpy.mockRestore();
        });
    });
});
