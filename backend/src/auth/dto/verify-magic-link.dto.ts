import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyMagicLinkDto {
  @IsNotEmpty({ message: 'Email should not be empty.' })
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsNotEmpty({ message: 'Token should not be empty.' })
  @IsString()
  token: string;
}
