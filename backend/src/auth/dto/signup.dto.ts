import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class SignUpDto {
  @IsNotEmpty({ message: 'Email should not be empty.' })
  @IsString()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email: string;

  @IsNotEmpty({ message: 'Password should not be empty.' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(50, { message: 'Password must be at most 50 characters long.' })
  // Add more password complexity rules if needed (e.g., using @Matches decorator)
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Name should not be empty.' })
  @MaxLength(100, { message: 'Name must be at most 100 characters long.' })
  name?: string;
}
