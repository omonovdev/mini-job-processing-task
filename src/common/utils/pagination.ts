import { SelectQueryBuilder } from 'typeorm';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export async function paginate<T extends object>(
  qb: SelectQueryBuilder<T>,
  params: PaginationParams,
): Promise<PaginatedResult<T>> {
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(Math.max(params.limit || DEFAULT_LIMIT, 1), MAX_LIMIT);

  qb.skip((page - 1) * limit).take(limit);

  const [data, total] = await qb.getManyAndCount();
  return { data, total, page, limit };
}
