import { Module } from '@nestjs/common';
import { UserService } from './user.service';
// PrismaModule is global

@Module({
  providers: [UserService],
  exports: [UserService], // Export UserService so it can be injected into AuthModule
})
export class UserModule {}
