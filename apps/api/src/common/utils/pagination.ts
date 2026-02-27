export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function calculatePagination(
  page: number = 1,
  limit: number = 20,
): { skip: number; take: number } {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

  return {
    skip: (normalizedPage - 1) * normalizedLimit,
    take: normalizedLimit,
  };
}

export function createPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  return {
    total,
    page,
    limit,
    totalPages,
    hasMore: skip + limit < total,
  };
}
