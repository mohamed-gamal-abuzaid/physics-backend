import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const getPagination = (input: PaginationInput) => ({
  limit: input.limit,
  offset: (input.page - 1) * input.limit,
});

export const paginated = <T>(items: T[], page: number, limit: number, total: number) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});