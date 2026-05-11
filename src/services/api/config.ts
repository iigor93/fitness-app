const fallbackApiUrl = 'http://localhost:3000';

export const apiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? fallbackApiUrl,
  timeout: 10000,
};
