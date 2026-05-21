import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGameItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'itemKey faqat lotin kichik harflar, raqam, "_" yoki "-" bo\'lishi mumkin',
  })
  itemKey!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  onomatopoeia?: string;

  @IsOptional()
  @IsNumber()
  pitch?: number;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsNumber()
  frequency?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}

export class UpdateGameItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  onomatopoeia?: string;

  @IsOptional()
  @IsNumber()
  pitch?: number;

  @IsOptional()
  @IsNumber()
  rate?: number;

  @IsOptional()
  @IsNumber()
  frequency?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
