import prisma from "@/lib/prisma";
import { NotFoundError, ForbiddenError, AppError } from "@/utils/error.util";
import { HTTP_STATUS, USER_ROLES } from "@/lib/constants";
import type { Prisma, Comment, User, Material } from "@prisma/client";

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
 * Formatted Comment Response
 */
interface FormattedComment {
  id: string;
  content: string;
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
  material_id: string;
  parent_id: string | null;
  replies_count?: number;
  replies?: FormattedComment[];
}

/**
 * Comment with user and replies count
 */
type CommentWithUserAndCount = Comment & {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
  _count: {
    replies: number;
  };
};

/**
 * Comment with user, replies and count
 */
type CommentWithUserRepliesAndCount = Comment & {
  user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  };
  replies: (Comment & {
    user: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      role: string;
    };
  })[];
  _count: {
    replies: number;
  };
};

/**
 * Comment with material info
 */
type CommentWithMaterial = Comment & {
  material: {
    id: string;
    title: string;
    section: {
      course: {
        id: string;
        title: string;
      };
    };
  } | null;
  _count: {
    replies: number;
  };
};

/**
 * Comment Service
 * Handles comment and discussion operations
 */
export class CommentService {
  /**
   * Create new comment
   */
  async createComment(userId: string, data: CreateCommentData) {
    try {
      console.log("💬 Creating comment for user:", userId);

      const { materialId, content, parentId } = data;

      // Validate input
      if (!materialId || !content) {
        throw new AppError(
          "Material ID and content are required",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      if (content.length < 1 || content.length > 1000) {
        throw new AppError(
          "Comment must be between 1 and 1000 characters",
          HTTP_STATUS.BAD_REQUEST
        );
      }

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
        throw new NotFoundError("Material not found");
      }

      // Check if user is enrolled (unless it's a free preview)
      if (!material.is_free) {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            user_id: userId,
            course_id: material.section.course_id,
            status: "ACTIVE",
          },
        });

        if (!enrollment) {
          throw new ForbiddenError(
            "You must be enrolled in the course to comment on this material"
          );
        }
      }

      // If replying, check parent comment exists
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId },
        });

        if (!parentComment) {
          throw new NotFoundError("Parent comment not found");
        }

        if (parentComment.material_id !== materialId) {
          throw new ForbiddenError(
            "Parent comment belongs to different material"
          );
        }
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          user_id: userId,
          material_id: materialId,
          content: content.trim(),
          parent_id: parentId,
          is_edited: false,
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
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

      console.log("✅ Comment created successfully:", comment.id);

      return {
        id: comment.id,
        content: comment.content,
        is_edited: comment.is_edited,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: comment.user,
        material_id: comment.material_id,
        parent_id: comment.parent_id,
        replies_count: comment._count.replies,
      };
    } catch (error) {
      console.error("❌ Create comment failed:", error);
      throw error;
    }
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
      sortOrder?: "asc" | "desc";
    } = {}
  ) {
    try {
      console.log("💬 Getting comments for material:", materialId);

      const {
        page = 1,
        limit = 20,
        sortBy = "created_at",
        sortOrder = "desc",
      } = options;

      // Validate pagination
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(100, Math.max(1, limit));
      const skip = (validatedPage - 1) * validatedLimit;

      // Check if material exists
      const material = await prisma.material.findUnique({
        where: { id: materialId },
      });

      if (!material) {
        throw new NotFoundError("Material not found");
      }

      // Only get top-level comments (no parent)
      const where: Prisma.CommentWhereInput = {
        material_id: materialId,
        parent_id: null,
      };

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where,
          skip,
          take: validatedLimit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
                role: true,
              },
            },
            replies: {
              take: 3, // Show first 3 replies
              orderBy: { created_at: "asc" },
              include: {
                user: {
                  select: {
                    id: true,
                    full_name: true,
                    avatar_url: true,
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
        }) as Promise<CommentWithUserRepliesAndCount[]>,
        prisma.comment.count({ where }),
      ]);

      const formattedComments: FormattedComment[] = comments.map(
        (comment: CommentWithUserRepliesAndCount) => ({
          id: comment.id,
          content: comment.content,
          is_edited: comment.is_edited,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user: comment.user,
          material_id: comment.material_id,
          parent_id: comment.parent_id,
          replies: comment.replies.map(
            (
              reply: Comment & {
                user: {
                  id: string;
                  full_name: string | null;
                  avatar_url: string | null;
                  role: string;
                };
              }
            ) => ({
              id: reply.id,
              content: reply.content,
              is_edited: reply.is_edited,
              created_at: reply.created_at,
              updated_at: reply.updated_at,
              user: reply.user,
              material_id: reply.material_id,
              parent_id: reply.parent_id,
            })
          ),
          replies_count: comment._count.replies,
        })
      );

      console.log("✅ Retrieved comments:", {
        materialId,
        count: comments.length,
      });

      return {
        data: formattedComments,
        meta: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit),
        },
      };
    } catch (error) {
      console.error("❌ Get material comments failed:", error);
      throw error;
    }
  }

  /**
   * Get comment by ID
   */
  async getCommentById(commentId: string) {
    try {
      console.log("💬 Getting comment by ID:", commentId);

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
              role: true,
            },
          },
          material: {
            select: {
              id: true,
              title: true,
              section: {
                select: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          parent: {
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  full_name: true,
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
        throw new NotFoundError("Comment not found");
      }

      // PERBAIKAN: Akses material_id langsung dari comment
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        is_edited: comment.is_edited,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: comment.user,
        material: comment.material,
        material_id: comment.material_id, // Akses langsung dari model Comment
        parent: comment.parent,
        replies_count: comment._count.replies,
      };

      console.log("✅ Comment retrieved successfully:", commentId);

      return formattedComment;
    } catch (error) {
      console.error("❌ Get comment by ID failed:", error);
      throw error;
    }
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
    try {
      console.log("💬 Getting replies for comment:", commentId);

      const { page = 1, limit = 20 } = options;

      // Validate pagination
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(100, Math.max(1, limit));
      const skip = (validatedPage - 1) * validatedLimit;

      // Check if parent comment exists
      const parentComment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!parentComment) {
        throw new NotFoundError("Parent comment not found");
      }

      const [replies, total] = await Promise.all([
        prisma.comment.findMany({
          where: { parent_id: commentId },
          skip,
          take: validatedLimit,
          orderBy: { created_at: "asc" },
          include: {
            user: {
              select: {
                id: true,
                full_name: true,
                avatar_url: true,
                role: true,
              },
            },
          },
        }),
        prisma.comment.count({ where: { parent_id: commentId } }),
      ]);

      const formattedReplies: FormattedComment[] = replies.map(
        (
          reply: Comment & {
            user: {
              id: string;
              full_name: string | null;
              avatar_url: string | null;
              role: string;
            };
          }
        ) => ({
          id: reply.id,
          content: reply.content,
          is_edited: reply.is_edited,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          user: reply.user,
          material_id: reply.material_id,
          parent_id: reply.parent_id,
        })
      );

      console.log("✅ Retrieved replies:", {
        commentId,
        count: replies.length,
      });

      return {
        data: formattedReplies,
        meta: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit),
        },
      };
    } catch (error) {
      console.error("❌ Get comment replies failed:", error);
      throw error;
    }
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
    try {
      console.log("💬 Updating comment:", { commentId, userId });

      const { content } = data;

      // Validate content
      if (!content || content.length < 1 || content.length > 1000) {
        throw new AppError(
          "Comment must be between 1 and 1000 characters",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundError("Comment not found");
      }

      // Check permission (owner or admin)
      if (comment.user_id !== userId && userRole !== USER_ROLES.ADMIN) {
        throw new ForbiddenError("You can only edit your own comments");
      }

      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content: content.trim(),
          is_edited: true,
          updated_at: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
              role: true,
            },
          },
        },
      });

      const formattedComment: FormattedComment = {
        id: updatedComment.id,
        content: updatedComment.content,
        is_edited: updatedComment.is_edited,
        created_at: updatedComment.created_at,
        updated_at: updatedComment.updated_at,
        user: updatedComment.user,
        material_id: updatedComment.material_id,
        parent_id: updatedComment.parent_id,
      };

      console.log("✅ Comment updated successfully:", commentId);

      return formattedComment;
    } catch (error) {
      console.error("❌ Update comment failed:", error);
      throw error;
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string, userRole: string) {
    try {
      console.log("💬 Deleting comment:", { commentId, userId });

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          replies: {
            take: 1, // Just check if there are any replies
          },
        },
      });

      if (!comment) {
        throw new NotFoundError("Comment not found");
      }

      // Check permission (owner or admin)
      if (comment.user_id !== userId && userRole !== USER_ROLES.ADMIN) {
        throw new ForbiddenError("You can only delete your own comments");
      }

      let result;

      // If has replies, soft delete by clearing content
      if (comment.replies.length > 0) {
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            content: "[Comment deleted by user]",
            is_edited: true,
            updated_at: new Date(),
          },
        });
        result = {
          id: commentId,
          deleted: false,
          message: "Comment content cleared (has replies)",
        };
      } else {
        // No replies, safe to delete
        // First delete any child comments (replies) if they exist
        await prisma.comment.deleteMany({
          where: { parent_id: commentId },
        });

        // Then delete the comment itself
        await prisma.comment.delete({
          where: { id: commentId },
        });
        result = {
          id: commentId,
          deleted: true,
          message: "Comment permanently deleted",
        };
      }

      console.log("✅ Comment deleted successfully:", result);

      return result;
    } catch (error) {
      console.error("❌ Delete comment failed:", error);
      throw error;
    }
  }

  /**
   * Report comment
   */
  async reportComment(commentId: string, userId: string, reason: string) {
    try {
      console.log("🚩 Reporting comment:", { commentId, userId, reason });

      // Validate reason
      if (!reason || reason.length < 10 || reason.length > 500) {
        throw new AppError(
          "Report reason must be between 10 and 500 characters",
          HTTP_STATUS.BAD_REQUEST
        );
      }

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              full_name: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundError("Comment not found");
      }

      // Check if user already reported this comment
      // Note: Anda perlu menambahkan model Report di Prisma schema
      // Untuk sementara, kita simpan di activity log
      const existingReport = await prisma.activityLog.findFirst({
        where: {
          user_id: userId,
          entity_type: "COMMENT",
          entity_id: commentId,
          action: "REPORT",
        },
      });

      if (existingReport) {
        throw new AppError(
          "You have already reported this comment",
          HTTP_STATUS.CONFLICT
        );
      }

      // Create report record in activity log
      const report = await prisma.activityLog.create({
        data: {
          user_id: userId,
          action: "REPORT",
          entity_type: "COMMENT",
          entity_id: commentId,
          metadata: {
            reason: reason.trim(),
            comment_content: comment.content,
            reported_user: comment.user.full_name,
          },
        },
      });

      console.log("✅ Comment reported successfully:", report.id);

      // TODO: In a real application, you might want to:
      // 1. Send notification to admins
      // 2. Check for multiple reports and auto-flag
      // 3. Log the report for moderation

      return {
        report_id: report.id,
        comment_id: commentId,
        reported: true,
        message: "Comment has been reported and will be reviewed by moderators",
      };
    } catch (error) {
      console.error("❌ Report comment failed:", error);
      throw error;
    }
  }

  /**
   * Get user's comments
   */
  async getUserComments(
    userId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      console.log("💬 Getting user comments:", userId);

      const { page = 1, limit = 20 } = options;

      // Validate pagination
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(100, Math.max(1, limit));
      const skip = (validatedPage - 1) * validatedLimit;

      const [comments, total] = await Promise.all([
        prisma.comment.findMany({
          where: { user_id: userId },
          skip,
          take: validatedLimit,
          orderBy: { created_at: "desc" },
          include: {
            material: {
              select: {
                id: true,
                title: true,
                section: {
                  select: {
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
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
        }) as Promise<CommentWithMaterial[]>,
        prisma.comment.count({ where: { user_id: userId } }),
      ]);

      const formattedComments = comments.map(
        (comment: CommentWithMaterial) => ({
          id: comment.id,
          content: comment.content,
          is_edited: comment.is_edited,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          material: comment.material,
          replies_count: comment._count.replies,
        })
      );

      console.log("✅ Retrieved user comments:", {
        userId,
        count: comments.length,
      });

      return {
        data: formattedComments,
        meta: {
          page: validatedPage,
          limit: validatedLimit,
          total,
          totalPages: Math.ceil(total / validatedLimit),
        },
      };
    } catch (error) {
      console.error("❌ Get user comments failed:", error);
      throw error;
    }
  }

  /**
   * Get comment statistics for admin
   */
  async getCommentStatistics() {
    try {
      console.log("📊 Getting comment statistics");

      const [
        totalComments,
        totalReplies,
        editedComments,
        recentComments,
        topCommenters,
      ] = await Promise.all([
        // Total comments (excluding replies)
        prisma.comment.count({
          where: { parent_id: null },
        }),
        // Total replies
        prisma.comment.count({
          where: { parent_id: { not: null } },
        }),
        // Edited comments
        prisma.comment.count({
          where: { is_edited: true },
        }),
        // Comments from last 7 days
        prisma.comment.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        // Top commenters (limit 10)
        prisma.comment.groupBy({
          by: ["user_id"],
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: "desc",
            },
          },
          take: 10,
        }),
      ]);

      const statistics = {
        total_comments: totalComments,
        total_replies: totalReplies,
        total_edited: editedComments,
        recent_comments: recentComments,
        top_commenters: topCommenters.map(
          (commenter: { user_id: string; _count: { id: number } }) => ({
            user_id: commenter.user_id,
            comment_count: commenter._count.id,
          })
        ),
      };

      console.log("✅ Comment statistics retrieved");

      return statistics;
    } catch (error) {
      console.error("❌ Get comment statistics failed:", error);
      throw error;
    }
  }

  /**
   * Toggle like on comment
   */
  async toggleCommentLike(commentId: string, userId: string) {
    try {
      console.log("❤️ Toggling like for comment:", { commentId, userId });

      // Check if comment exists
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundError("Comment not found");
      }

      // Check if user already liked this comment
      // Note: Anda perlu menambahkan model CommentLike di Prisma schema
      // Untuk sementara, kita simpan di activity log
      const existingLike = await prisma.activityLog.findFirst({
        where: {
          user_id: userId,
          entity_type: "COMMENT",
          entity_id: commentId,
          action: "LIKE",
        },
      });

      if (existingLike) {
        // Unlike - remove the like
        await prisma.activityLog.delete({
          where: { id: existingLike.id },
        });

        console.log("✅ Comment unliked:", commentId);
        return { liked: false, message: "Comment unliked" };
      } else {
        // Like - add like
        await prisma.activityLog.create({
          data: {
            user_id: userId,
            action: "LIKE",
            entity_type: "COMMENT",
            entity_id: commentId,
          },
        });

        console.log("✅ Comment liked:", commentId);
        return { liked: true, message: "Comment liked" };
      }
    } catch (error) {
      console.error("❌ Toggle comment like failed:", error);
      throw error;
    }
  }
}

const commentService = new CommentService();
export default commentService;
