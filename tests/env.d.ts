declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      API_TOKEN: string;
      AUTH_SECRET: string;
      BASE_URL: string;
      DATABASE_URL: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_USER: string;
      DEBUG_MODE: string;
      HOST: string;
      PORT: string;
      REDIS_HOST: string;
      REDIS_URL: string;
      SECRET_KEY: string;
    }
  }
}

export {};
