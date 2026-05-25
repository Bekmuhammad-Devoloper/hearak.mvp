import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @MinLength(1)
  childId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;
}
