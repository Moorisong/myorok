const appJson = require('./app.json');

export default ({ config }) => ({
    ...config,
    ...appJson.expo,
    extra: {
        ...appJson.expo.extra,
        eas: {
            projectId: "c0924bda-9321-4092-987b-bfef72708ed3",
        },
        EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
        EXPO_KAKAO_REST_API_KEY: process.env.EXPO_KAKAO_REST_API_KEY,
    },
});
