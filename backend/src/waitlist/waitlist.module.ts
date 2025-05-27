import { Module } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';
// PrismaModule is global, so PrismaService is available

@Module({
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService], // Export if other modules need to use WaitlistService
})
export class WaitlistModule {}
