export default {
    expo: {
        name: "myorok",
        slug: "myorok",
        extra: {
            eas: {
                projectId: "c0924bda-9321-4092-987b-bfef72708ed3",
            },
            EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
            EXPO_KAKAO_REST_API_KEY:
                process.env.EXPO_KAKAO_REST_API_KEY,
        },
        android: {
            package: "com.myorok.app", // ← 구글 플레이에서 사용할 고유 패키지명
        },
    },
};
