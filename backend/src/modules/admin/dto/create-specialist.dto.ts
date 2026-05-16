import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSpecialistDto {
  @IsString()
  @MinLength(2, { message: 'fullName must be at least 2 characters' })
  fullName!: string;

  @IsEmail({}, { message: 'email must be a valid email' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;
}

export class SetUserRoleDto {
  @IsString()
  role!: 'parent' | 'specialist' | 'admin';

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;
}
