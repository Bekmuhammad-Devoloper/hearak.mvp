import { IsString, MinLength } from 'class-validator';

export class PostChatDto {
  @IsString()
  @MinLength(1)
  childId!: string;

  @IsString()
  @MinLength(1)
  text!: string;
}
