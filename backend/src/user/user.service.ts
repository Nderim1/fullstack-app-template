import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Role, Prisma, MagicLink } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByMagicLinkToken(
    token: string,
  ): Promise<(MagicLink & { user: User }) | null> {
    return this.prisma.magicLink.findFirst({
      where: {
        token,
        expiresAt: { gt: new Date() },
        usedAt: null, // Ensure the link has not been used
      },
      include: {
        user: true, // Include the related user object
      },
    });
  }

  async markMagicLinkAsUsed(magicLinkId: number): Promise<MagicLink> {
    return this.prisma.magicLink.update({
      where: { id: magicLinkId },
      data: { usedAt: new Date() },
    });
  }

  async createMagicLink(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<MagicLink> {
    return this.prisma.magicLink.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  async createUser(
    email: string,
    passwordHash?: string,
    role: Role = Role.USER,
    name?: string,
    avatarUrl?: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        name,
        avatarUrl,
      },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async createUserInternal(data: {
    email: string;
    name?: string;
    avatarUrl?: string;
    role?: Role;
    passwordHash?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        role: data.role || Role.USER,
        passwordHash: data.passwordHash,
      },
    });
  }

  // Add other user-related methods as needed, e.g., updateUserRole, etc.
}
