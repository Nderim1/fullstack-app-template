import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class MagicLinkRequestDto {
  @IsNotEmpty({ message: 'Email should not be empty.' })
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;
}
