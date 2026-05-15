import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters' })
  fullName!: string;

  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;
}
