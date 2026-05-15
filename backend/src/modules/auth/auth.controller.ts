import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signup(@Body() dto: SignupDto) {
    return this.auth.signup(dto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  signin(@Body() dto: SigninDto) {
    return this.auth.signin(dto);
  }

  @Public()
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  signout() {
    return this.auth.signout();
  }

  /**
   * One-time admin bootstrap. Only works when no admin user exists yet.
   * Returns 409 after the first admin is created.
   */
  @Public()
  @Post('bootstrap-admin')
  @HttpCode(HttpStatus.CREATED)
  bootstrapAdmin(@Body() dto: BootstrapAdminDto) {
    return this.auth.bootstrapAdmin(dto);
  }
}
