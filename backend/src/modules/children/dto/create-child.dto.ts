import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

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
}
