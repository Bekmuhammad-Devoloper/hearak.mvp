import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';

import { SpecialistService } from './specialist.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateChildDto } from '../children/dto/create-child.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { AddAssignmentDto } from './dto/add-assignment.dto';

@UseGuards(RolesGuard)
@Roles('specialist')
@Controller('specialist')
export class SpecialistController {
  constructor(private readonly specialist: SpecialistService) {}

  @Get('stats')
  stats() {
    return this.specialist.stats();
  }

  @Get('patients')
  patients() {
    return this.specialist.patients();
  }

  @Post('patients')
  @HttpCode(HttpStatus.CREATED)
  createPatient(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateChildDto) {
    return this.specialist.createPatient(user, dto);
  }

  @Get('patients/:id')
  patient(@Param('id') id: string) {
    return this.specialist.patient(id);
  }

  @Post('patients/:id/notes')
  @HttpCode(HttpStatus.CREATED)
  addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
  ) {
    return this.specialist.addNote(user, id, dto);
  }

  @Post('patients/:id/assignments')
  @HttpCode(HttpStatus.CREATED)
  addAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddAssignmentDto,
  ) {
    return this.specialist.addAssignment(user, id, dto);
  }
}
