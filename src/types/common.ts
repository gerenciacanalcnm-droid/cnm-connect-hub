export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export type ID = string;
export type ISODate = string;
