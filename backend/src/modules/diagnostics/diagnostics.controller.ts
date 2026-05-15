import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';

import { DiagnosticsService } from './diagnostics.service';
import { SubmitDiagnosticsDto } from './dto/submit-diagnostics.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class DiagnosticsController {
  constructor(private readonly diagnostics: DiagnosticsService) {}

  @Public()
  @Get('diagnostics/questions')
  questions() {
    return this.diagnostics.getQuestions();
  }

  @Post('children/:id/diagnostics')
  @HttpCode(HttpStatus.CREATED)
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SubmitDiagnosticsDto,
  ) {
    return this.diagnostics.submit(user, id, dto);
  }
}
