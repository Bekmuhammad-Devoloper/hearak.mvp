import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateDiagnosticsQuestionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  ageGroup?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  weight?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateDiagnosticsQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  ageGroup?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  weight?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class SetSpecialistVerifiedDto {
  @IsBoolean()
  verified!: boolean;
}
