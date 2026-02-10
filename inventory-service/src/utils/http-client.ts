import axios from 'axios';
import axiosRetry from 'axios-retry';

export function createHttpClient(baseURL: string, apiKey: string) {
  const client = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
  });

  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
      return (
        axiosRetry.isNetworkOrIdempotentRequestError(error) ||
        error.response?.status === 503
      );
    },
  });

  return client;
}
