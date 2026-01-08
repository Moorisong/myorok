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
  database: {
    url: string;
  };
  googlePlay: {
    packageName: string;
    serviceAccountEmail: string;
    serviceAccountPrivateKey: string;
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
  database: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/myorok',
  },
  googlePlay: {
    packageName: process.env.GOOGLE_PLAY_PACKAGE_NAME || 'com.haroo.myorok',
    serviceAccountEmail: process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL || '',
    serviceAccountPrivateKey: (process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n'),
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

  // Warn for optional but recommended vars
  const optionalVars = ['MONGODB_URI', 'GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL'];
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      console.warn(`[Config] Warning: ${varName} not set, using default/mock`);
    }
  });
};

export { config, validateConfig };

