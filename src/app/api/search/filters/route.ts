import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/response.util';
import { errorHandler } from '@/middlewares/error.middleware';
import { corsMiddleware } from '@/middlewares/cors.middleware';
import { loggingMiddleware } from '@/middlewares/logging.middleware';
import { HTTP_STATUS } from '@/lib/constants';

async function handler(_request: NextRequest) {
  try {
    const [categories, levels, languages, priceRanges, ratingOptions] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              courses: {
                where: { status: 'PUBLISHED' },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),

      prisma.course.groupBy({
        by: ['level'],
        where: { status: 'PUBLISHED' },
        _count: { level: true },
        orderBy: { _count: { level: 'desc' } },
      }),

      prisma.course.groupBy({
        by: ['language'],
        where: { status: 'PUBLISHED' },
        _count: { language: true },
      }),

      prisma.course.aggregate({
        where: { status: 'PUBLISHED', isFree: false },
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),

      Promise.resolve([
        { label: '4.5 & up', value: 4.5 },
        { label: '4.0 & up', value: 4.0 },
        { label: '3.5 & up', value: 3.5 },
        { label: '3.0 & up', value: 3.0 },
      ]),
    ]);

    const minPrice = priceRanges._min.price || 0;
    const maxPrice = priceRanges._max.price || 1000000;
    const avgPrice = priceRanges._avg.price || 0;

    const priceOptions = [
      { label: 'Free', min: 0, max: 0 },
      { label: 'Under 100k', min: 1, max: 100000 },
      { label: '100k - 250k', min: 100000, max: 250000 },
      { label: '250k - 500k', min: 250000, max: 500000 },
      { label: 'Above 500k', min: 500000, max: maxPrice },
    ];

    const coursesWithTags = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { tags: true },
      take: 100,
    });

    const tagCounts = new Map<string, number>();
    coursesWithTags.forEach((course) => {
      course.tags.forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    const popularTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    const mentorsWithExpertise = await prisma.mentorProfile.findMany({
      where: { status: 'APPROVED' },
      select: { expertise: true },
    });

    const expertiseCounts = new Map<string, number>();
    mentorsWithExpertise.forEach((mentor) => {
      mentor.expertise.forEach((skill) => {
        expertiseCounts.set(skill, (expertiseCounts.get(skill) || 0) + 1);
      });
    });

    const popularExpertise = Array.from(expertiseCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([skill, count]) => ({ skill, count }));

    return successResponse(
      {
        courses: {
          categories: categories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            courseCount: cat._count.courses,
          })),
          levels: levels.map((l) => ({
            level: l.level,
            count: l._count.level,
          })),
          languages: languages.map((l) => ({
            language: l.language,
            count: l._count.language,
          })),
          priceRanges: {
            min: minPrice,
            max: maxPrice,
            average: Math.round(avgPrice),
            options: priceOptions,
          },
          ratings: ratingOptions,
          tags: popularTags,
        },
        mentors: {
          expertise: popularExpertise,
          experienceRanges: [
            { label: '0-2 years', min: 0, max: 2 },
            { label: '3-5 years', min: 3, max: 5 },
            { label: '6-10 years', min: 6, max: 10 },
            { label: '10+ years', min: 10, max: 100 },
          ],
        },
      },
      'Filter options retrieved successfully'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, HTTP_STATUS.BAD_REQUEST);
    }
    return errorResponse('Failed to get filter options', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}

export const GET = errorHandler(loggingMiddleware(corsMiddleware(handler)));
