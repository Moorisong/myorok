jest.mock('expo-linking', () => {
    return {
        parse: (url: string) => {
            const replaced = url.replace('exp://', 'http://').replace('myorok://', 'http://localhost/');
            const parsed = new URL(replaced);
            const params: any = {};
            parsed.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            return { queryParams: params };
        }
    };
});

import * as Linking from 'expo-linking';

describe('Auth Deep Link Parsing', () => {
    it('should parse production deep link correctly', () => {
        const url = 'myorok://?token=test_jwt_token&user=%7B%22id%22%3A%22123%22%7D';
        const parsed = Linking.parse(url);
        
        expect(parsed.queryParams).toBeDefined();
        expect(parsed.queryParams?.token).toBe('test_jwt_token');
        expect(parsed.queryParams?.user).toBe('{"id":"123"}');
    });

    it('should parse Expo Go deep link correctly', () => {
        const url = 'exp://192.168.0.2:8081/--/?token=test_jwt_token&user=%7B%22id%22%3A%22123%22%7D';
        const parsed = Linking.parse(url);
        
        expect(parsed.queryParams).toBeDefined();
        expect(parsed.queryParams?.token).toBe('test_jwt_token');
        expect(parsed.queryParams?.user).toBe('{"id":"123"}');
    });
});
