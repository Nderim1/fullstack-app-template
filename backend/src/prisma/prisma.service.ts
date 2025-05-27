import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      // Optional: log Prisma queries
      // log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    // Prisma Client automatically connects, but this is a good place for explicit connection if needed
    // or for logging successful connection.
    await this.$connect();
    console.log('Prisma Client connected successfully.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Prisma Client disconnected successfully.');
  }

  // Optional: Add a method for clean shutdown, useful for testing or specific scenarios
  async cleanDatabase() {
    // In a testing environment, you might want to delete data from tables
    // Be careful with this in production!
    if (process.env.NODE_ENV === 'test') {
      // The order of deletion matters due to foreign key constraints
      await this.magicLink.deleteMany({});
      await this.waitlistEntry.deleteMany({});
      await this.user.deleteMany({});
    }
  }
}
