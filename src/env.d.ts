declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CORS_ORIGIN: string
      DATABASE_URL: string
      REDIS_URL: string
      PORT: string
      JWT_SECRET: string
    }
  }
}

export {}
