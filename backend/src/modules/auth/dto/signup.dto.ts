import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters' })
  fullName!: string;

  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  /** Ro'l. Default — 'parent'. 'specialist' tanlangani uchun `verified: false`. */
  @IsOptional()
  @IsIn(['parent', 'specialist'])
  role?: 'parent' | 'specialist';

  /** Mutaxassis lavozimi (Logoped, Audiolog, Surdolog). Faqat role=specialist'da kerak. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;
}
