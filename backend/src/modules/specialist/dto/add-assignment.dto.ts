import { IsString, MinLength } from 'class-validator';

export class AddAssignmentDto {
  @IsString()
  @MinLength(1)
  title!: string;
}
