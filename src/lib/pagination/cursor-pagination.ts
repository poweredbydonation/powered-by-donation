/**
 * Cursor-Based Pagination for Large Datasets
 * Based on Pagy's Keyset pagination approach for 10M+ records
 * Alternative to OFFSET/LIMIT for extreme scale
 */

export interface CursorPaginationParams {
  limit: number;
  cursor?: string; // Base64 encoded cursor
  direction?: 'next' | 'prev';
}

export interface CursorResult<T> {
  data: T[];
  pagination: {
    has_next: boolean;
    has_previous: boolean;
    next_cursor?: string;
    prev_cursor?: string;
    total_results?: number; // Optional for cursor pagination
  };
}

// Cursor structure for stable sorting
interface Cursor {
  is_featured: boolean;
  total_donations_count: number;
  name: string;
  id: string;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64');
}

export function decodeCursor(cursorString: string): Cursor {
  try {
    return JSON.parse(Buffer.from(cursorString, 'base64').toString());
  } catch {
    throw new Error('Invalid cursor format');
  }
}

// Generate Supabase query with cursor pagination
export function buildCursorQuery(
  supabase: any,
  params: CursorPaginationParams,
  filters: Record<string, any> = {}
) {
  let query = supabase
    .from('organization_cache')
    .select('*')
    .eq('platform', 'justgiving')
    .eq('is_active', true)
    .eq('show_on_platform', true);

  // Apply filters first
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      query = query.eq(key, value);
    }
  });

  // Apply cursor-based pagination
  if (params.cursor) {
    const cursor = decodeCursor(params.cursor);
    
    if (params.direction === 'prev') {
      // Previous page: reverse the conditions
      query = query.or(
        `is_featured.gt.${cursor.is_featured},` +
        `and(is_featured.eq.${cursor.is_featured},total_donations_count.gt.${cursor.total_donations_count}),` +
        `and(is_featured.eq.${cursor.is_featured},total_donations_count.eq.${cursor.total_donations_count},name.lt.${cursor.name}),` +
        `and(is_featured.eq.${cursor.is_featured},total_donations_count.eq.${cursor.total_donations_count},name.eq.${cursor.name},id.lt.${cursor.id})`
      );
    } else {
      // Next page: standard conditions
      query = query.or(
        `is_featured.lt.${cursor.is_featured},` +
        `and(is_featured.eq.${cursor.is_featured},total_donations_count.lt.${cursor.total_donations_count}),` +
        `and(is_featured.eq.${cursor.is_featured},total_donations_count.eq.${cursor.total_donations_count},name.gt.${cursor.name}),` +
        `and(is_featured.eq.${cursor.is_featured},total_donations_count.eq.${cursor.total_donations_count},name.eq.${cursor.name},id.gt.${cursor.id})`
      );
    }
  }

  // Apply ordering (consistent with regular pagination)
  query = query
    .order('is_featured', { ascending: false })
    .order('total_donations_count', { ascending: false })
    .order('name', { ascending: true })
    .order('id', { ascending: true })
    .limit(params.limit + 1); // +1 to check if there's a next page

  return query;
}

export function processCursorResult<T extends Record<string, any>>(
  data: T[],
  limit: number
): CursorResult<T> {
  const hasNext = data.length > limit;
  const hasPrevious = true; // In real implementation, track this
  
  // Remove the extra record used for has_next detection
  if (hasNext) {
    data.pop();
  }

  let nextCursor: string | undefined;
  let prevCursor: string | undefined;

  if (data.length > 0) {
    const lastItem = data[data.length - 1];
    const firstItem = data[0];

    if (hasNext) {
      nextCursor = encodeCursor({
        is_featured: lastItem.is_featured,
        total_donations_count: lastItem.total_donations_count,
        name: lastItem.name,
        id: lastItem.id
      });
    }

    if (hasPrevious) {
      prevCursor = encodeCursor({
        is_featured: firstItem.is_featured,
        total_donations_count: firstItem.total_donations_count,
        name: firstItem.name,
        id: firstItem.id
      });
    }
  }

  return {
    data,
    pagination: {
      has_next: hasNext,
      has_previous: hasPrevious,
      next_cursor: nextCursor,
      prev_cursor: prevCursor
    }
  };
}

export default {
  buildQuery: buildCursorQuery,
  processResult: processCursorResult,
  encodeCursor,
  decodeCursor
};