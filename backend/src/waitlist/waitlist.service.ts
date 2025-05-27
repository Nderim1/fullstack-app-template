import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';
import { WaitlistEntry } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createWaitlistEntryDto: CreateWaitlistEntryDto,
  ): Promise<WaitlistEntry> {
    try {
      return await this.prisma.waitlistEntry.create({
        data: {
          email: createWaitlistEntryDto.email,
        },
      });
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002' // Unique constraint violation
      ) {
        throw new ConflictException(
          'This email address is already on the waitlist.',
        );
      }
      // Log the error for debugging purposes
      console.error('Error creating waitlist entry:', error);
      throw new InternalServerErrorException(
        'Could not add email to the waitlist. Please try again later.',
      );
    }
  }

  async findAll(): Promise<WaitlistEntry[]> {
    return this.prisma.waitlistEntry.findMany();
  }
}
