import prisma from '@/lib/prisma';
import { NotFoundError, ForbiddenError } from '@/utils/error.util';
import { HTTP_STATUS, USER_ROLES } from '@/lib/constants';
import type { Prisma } from '@prisma/client';

/**
 * Comment Creation Data
 */
interface CreateCommentData {
  materialId: string;
  content: string;
  parentId?: string;
}

/**
 * Comment Update Data
 */
interface UpdateCommentData {
  content: string;
}

/**
 * Comment Service
 * Handles comment and discussion operations
 */
export class CommentService {
  /**
   * Create new comment
   */
  async createComment(userId: string, data: CreateCommentData) {
    const { materialId, content, parentId } = data;

    // Check if material exists
    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        section: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundError('Material not found');
    }

    // Check if user is enrolled (unless it's a free preview)
    if (!material.isFree) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: material.section.course.id,
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenError('You must be enrolled to comment');
      }
    }

    // If replying, check parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundError('Parent comment not found');
      }

      if (parentComment.materialId !== materialId) {
        throw new ForbiddenError('Parent comment belongs to different material');
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        userId,
        materialId,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            role: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return comment;
  }

  /**
   * Get comments for material
   */
  async getMaterialComments(
    materialId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const skip = (page - 1) * limit;

    // Only get top-level comments (no parent)
    const where: Prisma.CommentWhereInput = {
      materialId,
      parentId: null,
    };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              role: true,
            },
          },
          replies: {
            take: 3, // Show first 3 replies
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profilePicture: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      data: comments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get comment by ID
   */
  async getCommentById(commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            role: true,
          },
        },
        material: {
          select: {
            id: true,
            title: true,
          },
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    return comment;
  }

  /**
   * Get replies for comment
   */
  async getCommentReplies(
    commentId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
              role: true,
            },
          },
        },
      }),
      prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    return {
      data: replies,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    userRole: string,
    data: UpdateCommentData
  ) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Check permission (owner or admin)
    if (comment.userId !== userId && userRole !== USER_ROLES.ADMIN) {
      throw new ForbiddenError('You can only edit your own comments');
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
        isEdited: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
            role: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string, userRole: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Check permission (owner or admin)
    if (comment.userId !== userId && userRole !== USER_ROLES.ADMIN) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    // If has replies, just hide content instead of deleting
    if (comment.replies.length > 0) {
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: '[Comment deleted by user]',
          isEdited: true,
        },
      });
    } else {
      // No replies, safe to delete
      await prisma.comment.delete({
        where: { id: commentId },
      });
    }

    return { id: commentId, deleted: true };
  }

  /**
   * Report comment
   */
  async reportComment(commentId: string, userId: string, reason: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // In production, create a report record
    // For now, just log it
    console.log('Comment reported:', {
      commentId,
      reportedBy: userId,
      reason,
    });

    // You can add a Report model in the future
    // await prisma.report.create({
    //   data: {
    //     commentId,
    //     reportedBy: userId,
    //     reason,
    //     status: 'PENDING',
    //   },
    // });

    return {
      commentId,
      reported: true,
      message: 'Comment has been reported and will be reviewed by moderators',
    };
  }
}

const commentService = new CommentService();
export default commentService;
