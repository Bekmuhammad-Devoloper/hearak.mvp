import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { publicUser } from '../../common/utils/mappers';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();
    const role = dto.role === 'specialist' ? 'specialist' : 'parent';
    const title = role === 'specialist' ? (dto.title?.trim() || 'Mutaxassis') : null;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        role,
        title,
        avatarLetter: fullName.charAt(0).toUpperCase() || 'A',
      },
    });

    return { token: this.signToken(user.id), user: publicUser(user) };
  }

  async signin(dto: SigninDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    return { token: this.signToken(user.id), user: publicUser(user) };
  }

  /**
   * Bootstrap birinchi admin foydalanuvchini yaratadi.
   *
   * Faqat DB'da admin user mavjud bo'lmaganida ishlaydi. Birinchi admin
   * yaratilgandan keyin endpoint 409 Conflict qaytaradi va boshqa
   * hech qachon ishlamaydi. Bu seed.ts ishlamay qolgan holatlar uchun
   * zaxira yo'l.
   */
  async bootstrapAdmin(dto: { email: string; password: string; fullName?: string }) {
    const existingAdmin = await this.prisma.user.findFirst({ where: { role: 'admin' } });
    if (existingAdmin) {
      throw new ConflictException('Admin already exists — bootstrap disabled');
    }

    const email = dto.email.trim().toLowerCase();
    const fullName = (dto.fullName ?? "Nutq Yo'li Admin").trim();
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const existing = await this.prisma.user.findUnique({ where: { email } });
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { role: 'admin', passwordHash, title: 'Super admin' },
        })
      : await this.prisma.user.create({
          data: {
            email,
            fullName,
            passwordHash,
            role: 'admin',
            title: 'Super admin',
            avatarLetter: fullName.charAt(0).toUpperCase() || 'H',
          },
        });

    return { token: this.signToken(user.id), user: publicUser(user) };
  }

  // Stateless JWT — signout is a client-side token discard. Endpoint exists for API symmetry.
  async signout() {
    return {};
  }

  private signToken(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }
}
