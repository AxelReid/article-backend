declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SESSION_SECRET: string
      CORS_ORIGIN: string
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: string;
    }
  }
}

export {}
