import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendNotificationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;

  /**
   * Kim qabul qiladi:
   *   - "all"        — barcha foydalanuvchilar
   *   - "parents"    — faqat ota-onalar
   *   - "specialists"— faqat mutaxassislar
   *   - "user"       — bitta foydalanuvchi (`userId` shart)
   */
  @IsIn(['all', 'parents', 'specialists', 'user'])
  audience!: 'all' | 'parents' | 'specialists' | 'user';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;
}
