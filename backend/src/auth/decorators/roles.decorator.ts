import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Assuming your Role enum is in Prisma client

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
