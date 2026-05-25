import { IsOptional, IsString, MinLength } from 'class-validator';

export class PostChatDto {
  @IsString()
  @MinLength(1)
  childId!: string;

  @IsString()
  @MinLength(1)
  text!: string;

  /** Berilmasa, yangi suhbat avtomatik yaratiladi (title = birinchi xabardan). */
  @IsOptional()
  @IsString()
  conversationId?: string;
}
