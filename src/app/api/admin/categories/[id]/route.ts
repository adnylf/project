// src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const categoryId = params.id;

    const result = await sql`
      SELECT 
        c.*,
        parent.name as parent_name,
        parent.slug as parent_slug,
        COUNT(DISTINCT co.id) as course_count,
        COUNT(DISTINCT co.id) FILTER (WHERE co.status = 'published') as published_courses,
        COUNT(DISTINCT co.id) FILTER (WHERE co.status = 'draft') as draft_courses,
        COUNT(DISTINCT sc.id) as subcategories_count,
        (
          SELECT json_agg(
            json_build_object(
              'id', sc2.id,
              'name', sc2.name,
              'slug', sc2.slug,
              'is_active', sc2.is_active,
              'course_count', (
                SELECT COUNT(*) FROM courses WHERE category_id = sc2.id
              )
            )
            ORDER BY sc2.order
          )
          FROM categories sc2
          WHERE sc2.parent_id = c.id
        ) as subcategories,
        (
          SELECT json_agg(
            json_build_object(
              'id', co2.id,
              'title', co2.title,
              'slug', co2.slug,
              'status', co2.status,
              'total_students', co2.total_students,
              'average_rating', co2.average_rating
            )
            ORDER BY co2.total_students DESC
          )
          FROM courses co2
          WHERE co2.category_id = c.id
          LIMIT 10
        ) as top_courses
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      LEFT JOIN courses co ON c.id = co.category_id
      LEFT JOIN categories sc ON c.id = sc.parent_id
      WHERE c.id = ${categoryId}
      GROUP BY c.id, parent.id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = result.rows[0];

    const activityStats = await sql`
      SELECT 
        COUNT(DISTINCT e.id) as total_enrollments,
        COUNT(DISTINCT e.user_id) as unique_students,
        COALESCE(SUM(t.amount), 0) as total_revenue,
        COUNT(DISTINCT r.id) as total_reviews,
        COALESCE(AVG(r.rating), 0) as average_rating
      FROM categories c
      LEFT JOIN courses co ON c.id = co.category_id
      LEFT JOIN enrollments e ON co.id = e.course_id
      LEFT JOIN transactions t ON co.id = t.course_id AND t.status = 'success'
      LEFT JOIN reviews r ON co.id = r.course_id
      WHERE c.id = ${categoryId}
    `;

    category.activity_statistics = activityStats.rows[0];

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const categoryId = params.id;

    const existingCategory = await sql`
      SELECT id, slug FROM categories WHERE id = ${categoryId}
    `;

    if (existingCategory.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, description, parent_id, icon, color, image_url, is_active, order } = body;

    if (slug && slug !== existingCategory.rows[0].slug) {
      const slugCheck = await sql`
        SELECT id FROM categories 
        WHERE slug = ${slug} AND id != ${categoryId}
      `;

      if (slugCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
    }

    if (parent_id) {
      if (parent_id === categoryId) {
        return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
      }

      const descendants = await sql`
        WITH RECURSIVE category_descendants AS (
          SELECT id FROM categories WHERE id = ${categoryId}
          UNION
          SELECT c.id FROM categories c
          INNER JOIN category_descendants cd ON c.parent_id = cd.id
        )
        SELECT id FROM category_descendants WHERE id = ${parent_id}
      `;

      if (descendants.rows.length > 0) {
        return NextResponse.json({ error: 'Cannot set descendant as parent' }, { status: 400 });
      }
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }

    if (slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (parent_id !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      values.push(parent_id);
    }

    if (icon !== undefined) {
      updates.push(`icon = $${paramCount++}`);
      values.push(icon);
    }

    if (color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(color);
    }

    if (image_url !== undefined) {
      updates.push(`image_url = $${paramCount++}`);
      values.push(image_url);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (order !== undefined) {
      updates.push(`"order" = $${paramCount++}`);
      values.push(order);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(categoryId);

    const query = `
      UPDATE categories
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql.query(query, values);

    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, 
        target_id, details
      )
      VALUES (
        ${decoded.userId},
        'update_category',
        'category',
        ${categoryId},
        ${JSON.stringify(body)}
      )
    `;

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const categoryId = params.id;

    const existingCategory = await sql`
      SELECT id, name FROM categories WHERE id = ${categoryId}
    `;

    if (existingCategory.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const coursesCheck = await sql`
      SELECT COUNT(*) as count FROM courses WHERE category_id = ${categoryId}
    `;

    if (parseInt(coursesCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated courses' },
        { status: 400 }
      );
    }

    const subcategoriesCheck = await sql`
      SELECT COUNT(*) as count FROM categories WHERE parent_id = ${categoryId}
    `;

    if (parseInt(subcategoriesCheck.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories' },
        { status: 400 }
      );
    }

    await sql`
      DELETE FROM categories WHERE id = ${categoryId}
    `;

    await sql`
      INSERT INTO admin_action_logs (
        admin_id, action_type, target_type, 
        target_id, details
      )
      VALUES (
        ${decoded.userId},
        'delete_category',
        'category',
        ${categoryId},
        ${JSON.stringify({ name: existingCategory.rows[0].name })}
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
