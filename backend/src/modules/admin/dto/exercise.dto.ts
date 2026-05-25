import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

const TYPES = ['Nutq', 'Eshitish', "O'yin"] as const;

export class CreateExerciseDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsIn([...TYPES])
  type!: (typeof TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stage?: number;

  /// Rehabilitatsiya kuni (1-N). null bo'lsa, mashq fond mashqi sifatida saqlanadi.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  day?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn([...TYPES])
  type?: (typeof TYPES)[number];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  day?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
