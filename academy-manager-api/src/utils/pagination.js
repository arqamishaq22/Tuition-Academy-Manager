/**
 * Pagination helper for SQL queries.
 * Safely parses and sanitizes ?page=1&limit=10 from Express req.query.
 * Enforces minimum limit of 1 and maximum limit of 100 to prevent denial of service.
 *
 * @param {import('express').Request} req - Express request object
 * @param {number} defaultLimit - Default limit per page (default: 10)
 * @returns {{ page: number, limit: number, offset: number, formatMeta: Function }}
 */
export function getPagination(req, defaultLimit = 10) {
  const rawPage = parseInt(req.query.page, 10);
  const rawLimit = parseInt(req.query.limit, 10);

  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  let limit = !isNaN(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;

  // Enforce maximum page size limit of 100
  if (limit > 100) {
    limit = 100;
  }

  const offset = (page - 1) * limit;

  /**
   * Helper to format pagination metadata for sendSuccess(res, data, meta)
   * @param {number} total - Total row count matching filters
   */
  const formatMeta = (total) => {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  };

  return {
    page,
    limit,
    offset,
    formatMeta,
  };
}

export default getPagination;
