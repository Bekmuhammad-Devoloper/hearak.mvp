import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSpeechCheckDto {
  @IsNumber()
  @Min(0)
  durationMs!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  avgLoudness!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  voiceActivityRatio!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
