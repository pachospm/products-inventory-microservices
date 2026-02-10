export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationLinks {
  self: string;
  first: string;
  last: string;
  next: string | null;
  prev: string | null;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = query as Record<string, unknown>;
  const pageObj = (page['page'] ?? {}) as Record<string, unknown>;
  const number = Math.max(1, Number(pageObj['number']) || 1);
  const size = Math.min(100, Math.max(1, Number(pageObj['size']) || 10));

  return { page: number, pageSize: size };
}

export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  return {
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(total / params.pageSize),
  };
}

export function buildPaginationLinks(
  basePath: string,
  meta: PaginationMeta,
): PaginationLinks {
  const buildUrl = (page: number) =>
    `${basePath}?page[number]=${page}&page[size]=${meta.pageSize}`;

  return {
    self: buildUrl(meta.page),
    first: buildUrl(1),
    last: buildUrl(meta.totalPages || 1),
    next: meta.page < meta.totalPages ? buildUrl(meta.page + 1) : null,
    prev: meta.page > 1 ? buildUrl(meta.page - 1) : null,
  };
}
