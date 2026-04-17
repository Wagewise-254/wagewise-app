// services/searchService.ts
import { useAuthStore } from '@/stores/authStore';
import { API_BASE_URL } from "@/config";

export interface SearchResult {
  id: string;
  type: 'employee' | 'payroll' | 'report';
  title: string;
  subtitle: string;
   extra?: string;
  badge: string;
  badgeColor: string;
  url: string;
  icon?: string;
  avatar?: string;
  metadata?: Record<string, string | number | null>;
}

export interface QuickSearchItem {
  id: string;
  type: string;
  label: string;
  description: string;
  url: string;
}

export interface GlobalSearchResponse {
  employees: SearchResult[];
  payrollRuns: SearchResult[];
  reports: SearchResult[];
}

// Get the API base URL from environment or use relative path
// const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class SearchService {
  private abortController: AbortController | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  // Global search with debounce
  async globalSearch(
    companyId: string,
    query: string,
    signal?: AbortSignal
  ): Promise<GlobalSearchResponse> {
    const emptyResult: GlobalSearchResponse = {
      employees: [],
      payrollRuns: [],
      reports: [],
    };

    // 1. Get the session from your Zustand store
    const session = useAuthStore.getState().session;
    const token = session?.access_token;

    if (!token) {
      console.error("No auth token found");
      return emptyResult;
    }

    if (!query || query.length < 2 || !companyId) {
      return emptyResult;
    }

    try {
      const url = `${API_BASE_URL}/company/${companyId}/search?q=${encodeURIComponent(query)}`;
      console.log('Searching:', url); // Debug log
      
      const response = await fetch(url, { 
        signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Search API error:', response.status, response.statusText);
        return emptyResult;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid response type:', contentType);
        return emptyResult;
      }

      const data = await response.json() as GlobalSearchResponse;
      return data;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Global search error:', error);
      }
      return emptyResult;
    }
  }

  // Quick search for dropdown
  async quickSearch(
    companyId: string,
    query: string
  ): Promise<QuickSearchItem[]> {
    const session = useAuthStore.getState().session;
    const token = session?.access_token;
    
    if (!token) {
      console.error("No auth token found");
      return [];
    }
    
    if (!query || query.length < 1 || !companyId) {
      return [];
    }

    try {
      const url = `${API_BASE_URL}/company/${companyId}/search/quick?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error('Quick search API error:', response.status);
        return [];
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return [];
      }

      const data = await response.json() as { items: QuickSearchItem[] };
      return data.items || [];
    } catch (error) {
      console.error('Quick search error:', error);
      return [];
    }
  }

  // Debounced search function
  debouncedSearch(
    companyId: string,
    query: string,
    callback: (results: GlobalSearchResponse | null) => void,
    delay: number = 300
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.abortController = new AbortController();

    this.debounceTimer = setTimeout(async () => {
      try {
        const results = await this.globalSearch(
          companyId,
          query,
          this.abortController?.signal ?? undefined
        );
        callback(results);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Search error:', error);
          callback(null);
        }
      } finally {
        this.abortController = null;
      }
    }, delay);
  }

  cancel(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}

export const searchService = new SearchService();