// services/user.service.ts
import prisma from "@/lib/prisma";
import { hashPassword } from "@/utils/crypto.util";
import { ConflictError, NotFoundError } from "@/utils/error.util";
import { USER_STATUS, USER_ROLES } from "@/lib/constants";
import type { UserRole, UserStatus } from "@prisma/client";

// Interface untuk transformed user
interface TransformedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  profilePicture?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
  lastLoginAt?: Date | null;
}

// Interface untuk role count
interface RoleCount {
  role: UserRole;
  _count: number;
}

// Interface untuk status count
interface StatusCount {
  status: UserStatus;
  _count: number;
}

// Interface untuk search user
interface SearchUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
}

/**
 * User Service
 * Handles user CRUD operations and management
 */
export class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      status,
      sortBy = "created_at",
      sortOrder = "desc",
    } = params;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          full_name: true,
          role: true,
          status: true,
          avatar_url: true,
          email_verified: true,
          created_at: true,
          updated_at: true,
          last_login: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform data to match expected format
    const transformedUsers: TransformedUser[] = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.status,
      profilePicture: user.avatar_url,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login,
    }));

    return {
      data: transformedUsers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        avatar_url: true,
        bio: true,
        phone: true,
        date_of_birth: true,
        address: true,
        city: true,
        country: true,
        disability_type: true,
        email_verified: true,
        email_verified_at: true,
        created_at: true,
        updated_at: true,
        last_login: true,
        mentor_profile: {
          select: {
            id: true,
            expertise: true,
            experience: true,
            status: true,
            total_students: true,
            total_courses: true,
            average_rating: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Transform data to match expected format
    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.status,
      profilePicture: user.avatar_url,
      bio: user.bio,
      phoneNumber: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      city: user.city,
      country: user.country,
      disabilityType: user.disability_type,
      emailVerified: user.email_verified,
      emailVerifiedAt: user.email_verified_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.last_login,
      mentorProfile: user.mentor_profile
        ? {
            id: user.mentor_profile.id,
            expertise: user.mentor_profile.expertise,
            experience: user.mentor_profile.experience,
            status: user.mentor_profile.status,
            totalStudents: user.mentor_profile.total_students,
            totalCourses: user.mentor_profile.total_courses,
            averageRating: user.mentor_profile.average_rating,
          }
        : null,
    };
  }

  /**
   * Create new user (admin only)
   */
  async createUser(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    status?: UserStatus;
    disability_type?: string;
  }) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        full_name: data.name,
        role: data.role || USER_ROLES.STUDENT,
        status: data.status || USER_STATUS.ACTIVE,
        disability_type: data.disability_type,
        email_verified: false,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        disability_type: true,
        created_at: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.status,
      disabilityType: user.disability_type,
      createdAt: user.created_at,
    };
  }

  /**
   * Update user profile
   */
  async updateUser(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      phoneNumber?: string;
      dateOfBirth?: Date;
      address?: string;
      city?: string;
      country?: string;
      disabilityType?: string;
      avatar_url?: string | null;
    }
  ) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        full_name: data.name,
        bio: data.bio,
        phone: data.phoneNumber,
        date_of_birth: data.dateOfBirth,
        address: data.address,
        city: data.city,
        country: data.country,
        disability_type: data.disabilityType,
        avatar_url: data.avatar_url,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        avatar_url: true,
        bio: true,
        phone: true,
        date_of_birth: true,
        address: true,
        city: true,
        country: true,
        disability_type: true,
        updated_at: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.status,
      profilePicture: user.avatar_url,
      bio: user.bio,
      phoneNumber: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      city: user.city,
      country: user.country,
      disabilityType: user.disability_type,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.full_name,
      role: updatedUser.role,
    };
  }

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, status: UserStatus) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        full_name: true,
        status: true,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.full_name,
      status: updatedUser.status,
    };
  }

  /**
   * Delete user (soft delete by setting status to INACTIVE)
   */
  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Soft delete: set status to INACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { status: USER_STATUS.INACTIVE },
    });

    return { id: userId, deleted: true };
  }

  /**
   * Hard delete user (admin only, permanent)
   */
  async hardDeleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Permanent delete
    await prisma.user.delete({
      where: { id: userId },
    });

    return { id: userId, deleted: true, permanent: true };
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Update status to SUSPENDED
    await prisma.user.update({
      where: { id: userId },
      data: { status: USER_STATUS.SUSPENDED },
    });

    // TODO: Log suspension with reason
    // await prisma.activityLog.create({...})

    return { id: userId, suspended: true, reason };
  }

  /**
   * Activate user
   */
  async activateUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: USER_STATUS.ACTIVE },
    });

    return { id: userId, activated: true };
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    const [total, byRole, byStatus, newThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      prisma.user.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.user.count({
        where: {
          created_at: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      total,
      byRole: Object.fromEntries(
        (byRole as RoleCount[]).map((r: RoleCount) => [r.role, r._count])
      ),
      byStatus: Object.fromEntries(
        (byStatus as StatusCount[]).map((s: StatusCount) => [
          s.status,
          s._count,
        ])
      ),
      newThisMonth,
    };
  }

  /**
   * Search users
   */
  async searchUsers(query: string, limit: number = 10) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { full_name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        avatar_url: true,
      },
    });

    return (users as SearchUser[]).map((user: SearchUser) => ({
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      profilePicture: user.avatar_url,
    }));
  }

  /**
   * Update user profile picture
   */
  async updateProfilePicture(userId: string, avatarUrl: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar_url: avatarUrl,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        avatar_url: true,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.full_name,
      profilePicture: updatedUser.avatar_url,
    };
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        avatar_url: true,
        email_verified: true,
        created_at: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.full_name,
      role: user.role,
      status: user.status,
      profilePicture: user.avatar_url,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
    };
  }

  /**
   * Verify user email
   */
  async verifyUserEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        email_verified: true,
        email_verified_at: new Date(),
      },
    });

    return { id: userId, emailVerified: true };
  }
}

// Export singleton instance
const userService = new UserService();
export default userService;
