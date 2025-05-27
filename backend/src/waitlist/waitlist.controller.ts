import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { CreateWaitlistEntryDto } from './dto/create-waitlist-entry.dto';

@Controller('waitlist')
export class WaitlistController {
  private readonly logger = new Logger(WaitlistController.name);

  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async joinWaitlist(@Body() createWaitlistEntryDto: CreateWaitlistEntryDto) {
    this.logger.log(
      `Received request to join waitlist for email: ${createWaitlistEntryDto.email}`,
    );
    try {
      const entry = await this.waitlistService.create(createWaitlistEntryDto);
      this.logger.log(`Email ${entry.email} successfully added to waitlist.`);
      return {
        statusCode: HttpStatus.CREATED,
        message: 'You have been successfully added to the waitlist!',
        data: { email: entry.email, createdAt: entry.createdAt },
      };
    } catch (error) {
      this.logger.error(
        `Failed to add email ${createWaitlistEntryDto.email} to waitlist: ${error.message}`,
        error.stack,
      );
      // Error handling is done in the service, re-throw or handle specific controller errors if needed
      throw error;
    }
  }
}
