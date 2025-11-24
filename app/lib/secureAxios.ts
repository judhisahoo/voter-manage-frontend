import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  metadata?: {
    startTime: number;
  };
}

interface RequestOptions {
  retry?: number;
  timeout?: number;
}

class SecureApiClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number = 3;

  constructor(
    baseURL: string = process.env.NEXT_PUBLIC_API_URL || '',
    timeout: number = 30000
  ) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private addSecurityHeaders(
    headers: Record<string, string> = {}
  ): Record<string, string> {
    const token = Cookies.get('access_token');
    const csrfToken = Cookies.get('XSRF-TOKEN');

    return {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Request-ID': uuidv4(),
      'X-Request-Time': new Date().toISOString(),
      'X-API-Version': '1',
      'X-Client-Platform': 'web',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
      ...headers,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestConfig = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: this.addSecurityHeaders(options.headers),
      ...(options.body && { body: options.body }),
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ API Response:', {
          status: response.status,
          url: endpoint,
          duration: `${duration}ms`,
          requestId: (config.headers as any)['X-Request-ID'],
        });
      }

      // Handle 401 - Redirect to login
      if (response.status === 401) {
        Cookies.remove('access_token');
        Cookies.remove('user');
        window.location.href = '/voter-data-manage-login';
        throw new Error('Unauthorized');
      }

      // Handle other errors
      if (!response.ok) {
        // Retry on 5xx errors
        if (response.status >= 500 && retryCount < this.maxRetries) {
          console.warn(`Retrying request (${retryCount + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.error('❌ API Error:', {
        url: endpoint,
        error: error.message,
        duration: `${duration}ms`,
        retryCount,
      });

      throw error;
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async put<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }
}

export const apiClient = new SecureApiClient();