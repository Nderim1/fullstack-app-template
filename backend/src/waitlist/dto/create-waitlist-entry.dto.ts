import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateWaitlistEntryDto {
  @IsNotEmpty({ message: 'Email should not be empty.' })
  @IsString({ message: 'Email must be a string.' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;
}
