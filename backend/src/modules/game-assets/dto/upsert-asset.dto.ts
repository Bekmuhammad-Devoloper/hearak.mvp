import { IsIn, IsString, MinLength } from 'class-validator';

export class UpsertAssetDto {
  @IsString()
  @IsIn(['image', 'sound'])
  kind!: 'image' | 'sound';

  @IsString()
  @MinLength(20)
  dataUrl!: string;
}
