import dotenv from 'dotenv';

dotenv.config();

interface Config {
  kakao: {
    restApiKey: string;
    clientSecret: string;
    redirectUri: string;
  };
  jwt: {
    secret: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  admin: {
    kakaoIds: string;
  };
}

const config: Config = {
  kakao: {
    restApiKey: process.env.KAKAO_REST_API_KEY || '',
    clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
    redirectUri: process.env.KAKAO_REDIRECT_URI || 'https://myorok.haroo.site/auth/kakao',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  admin: {
    kakaoIds: process.env.ADMIN_KAKAO_IDS || '',
  },
};

// Validate required environment variables
const validateConfig = (): void => {
  const requiredEnvVars = [
    'KAKAO_REST_API_KEY',
    'KAKAO_CLIENT_SECRET',
    'JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
};

export { config, validateConfig };
