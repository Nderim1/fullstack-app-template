import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available throughout the app
      envFilePath: '.env', // Specifies the .env file path
    }),
    PrismaModule, // Global module, already provides PrismaService
    AuthModule,
    UserModule,
    WaitlistModule,
    EmailModule,
  ],
  controllers: [],
  providers: [
    // Provide a global logger instance if needed, or use Nest's default
    Logger,
  ],
})
export class AppModule {}
