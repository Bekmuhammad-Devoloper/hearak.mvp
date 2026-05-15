import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  // Foydalanuvchi yuklagan avatar — data URL (data:image/jpeg;base64,...) yoki publik URL.
  // 2MB chegara — ~2,800,000 belgi base64'da.
  @IsOptional()
  @IsString()
  @MaxLength(2_800_000)
  @Matches(/^(data:image\/(jpeg|jpg|png|webp|gif);base64,|https?:\/\/|\/)/i, {
    message: 'avatarUrl must be a data URL (image), https:// URL, or relative path',
  })
  avatarUrl?: string;
}
