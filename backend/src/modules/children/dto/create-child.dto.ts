import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsDateString()
  dob!: string;

  @IsDateString()
  implantDate!: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  /** data:image/... URL yoki publik URL. Frontend'da 512px'gacha kichraytiriladi. */
  @IsOptional()
  @IsString()
  @MaxLength(6_000_000)
  avatarUrl?: string;
}
