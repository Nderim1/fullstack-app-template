import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config'; // ConfigService is used by EmailService

@Module({
  imports: [ConfigModule], // Ensure ConfigModule is imported if not global or already available
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
