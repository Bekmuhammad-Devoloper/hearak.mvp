import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, Max, Min } from 'class-validator';

export class SubmitDiagnosticsDto {
  @IsArray()
  @ArrayMinSize(8)
  @ArrayMaxSize(8)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(2, { each: true })
  answers!: number[];
}
