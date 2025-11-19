import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const parentId = searchParams.get('parent_id');
    const isActive = searchParams.get('is_active');
    const sortBy = searchParams.get('sort_by') || 'order';
    const sortOrder = searchParams.get('sort_order') || 'asc';
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: unknown[] = [];

    if (search) {
      whereConditions.push(
        `(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`
      );
      params.push(`%${search}%`);
    }

    if (parentId !== null) {
      if (parentId === 'null') {
        whereConditions.push('parent_id IS NULL');
      } else {
        whereConditions.push(`parent_id = $${params.length + 1}`);
        params.push(parentId);
      }
    }

    if (isActive !== null) {
      whereConditions.push(`is_active = $${params.length + 1}`);
      params.push(isActive === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const validSortColumns = ['order', 'name', 'created_at', 'course_count'];
    const validatedSortBy = validSortColumns.includes(sortBy) ? sortBy : 'order';
    const validatedSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const query = `
      WITH RECURSIVE category_tree AS (
        SELECT 
          c.*,
          COUNT(DISTINCT co.id) as course_count,
          0 as depth
        FROM categories c
        LEFT JOIN courses co ON c.id = co.category_id
        ${whereClause}
        GROUP BY c.id
        
        UNION ALL
        
        SELECT 
          c.*,
          COUNT(DISTINCT co.id) as course_count,
          ct.depth + 1
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
        LEFT JOIN courses co ON c.id = co.category_id
        GROUP BY c.id
      )
      SELECT 
        ct.*,
        parent.name as parent_name,
        (
          SELECT json_agg(
            json_build_object(
              'id', sc.id,
              'name', sc.name,
              'slug', sc.slug,
              'is_active', sc.is_active,
              'course_count', COUNT(DISTINCT sco.id)
            )
          )
          FROM categories sc
          LEFT JOIN courses sco ON sc.id = sco.category_id
          WHERE sc.parent_id = ct.id
          GROUP BY sc.id
        ) as subcategories
      FROM category_tree ct
      LEFT JOIN categories parent ON ct.parent_id = parent.id
      ORDER BY ct.${validatedSortBy} ${validatedSortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    const result = await sql.query(query, params);

    // FIXED: Execute count query separately without reusing params
    const countWhereConditions: string[] = [];
    const countParams: unknown[] = [];

    if (search) {
      countWhereConditions.push(
        `(name ILIKE $${countParams.length + 1} OR description ILIKE $${countParams.length + 1})`
      );
      countParams.push(`%${search}%`);
    }

    if (parentId !== null) {
      if (parentId === 'null') {
        countWhereConditions.push('parent_id IS NULL');
      } else {
        countWhereConditions.push(`parent_id = $${countParams.length + 1}`);
        countParams.push(parentId);
      }
    }

    if (isActive !== null) {
      countWhereConditions.push(`is_active = $${countParams.length + 1}`);
      countParams.push(isActive === 'true');
    }

    const countWhereClause =
      countWhereConditions.length > 0 ? `WHERE ${countWhereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM categories
      ${countWhereClause}
    `;

    const countResult = await sql.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_categories,
        COUNT(*) FILTER (WHERE is_active = true) as active_categories,
        COUNT(*) FILTER (WHERE parent_id IS NULL) as root_categories,
        SUM(course_count) as total_courses
      FROM (
        SELECT 
          c.*,
          COUNT(co.id) as course_count
        FROM categories c
        LEFT JOIN courses co ON c.id = co.category_id
        GROUP BY c.id
      ) stats
    `;

    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      statistics: statsResult.rows[0],
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, description, parent_id, icon, color, image_url, is_active, order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // FIXED: Await the query result before checking rows
    const existingCategory = await sql`
      SELECT id FROM categories WHERE slug = ${slug}
    `;

    if (existingCategory.rows.length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    if (parent_id) {
      // FIXED: Await the query result
      const parentCategory = await sql`
        SELECT id FROM categories WHERE id = ${parent_id}
      `;

      if (parentCategory.rows.length === 0) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
      }
    }

    let categoryOrder = order;
    if (!categoryOrder) {
      // FIXED: Use parameterized query instead of template literal with condition
      let lastOrderQuery;
      if (parent_id) {
        lastOrderQuery = await sql`
          SELECT COALESCE(MAX("order"), 0) as max_order
          FROM categories
          WHERE parent_id = ${parent_id}
        `;
      } else {
        lastOrderQuery = await sql`
          SELECT COALESCE(MAX("order"), 0) as max_order
          FROM categories
          WHERE parent_id IS NULL
        `;
      }
      categoryOrder = lastOrderQuery.rows[0].max_order + 1;
    }

    // FIXED: Use proper parameterized query with all values
    const result = await sql`
      INSERT INTO categories (
        name, slug, description, parent_id, 
        icon, color, image_url, is_active, "order"
      )
      VALUES (
        ${name}, ${slug}, ${description || null}, ${parent_id || null},
        ${icon || null}, ${color || null}, ${image_url || null}, 
        ${is_active ?? true}, ${categoryOrder}
      )
      RETURNING *
    `;

    const category = result.rows[0];

    // FIXED: Use proper parameterized query for admin logs
    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, 
        target_id, details
      )
      VALUES (
        ${decoded.userId},
        'create_category',
        'category',
        ${category.id},
        ${JSON.stringify({ name, slug })}
      )
    `;

    return NextResponse.json(
      {
        success: true,
        data: category,
        message: 'Category created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
