import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AddAssignmentDto } from '../specialist/dto/add-assignment.dto';
import { AddNoteDto } from '../specialist/dto/add-note.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CreateSpecialistDto, SetUserRoleDto } from './dto/create-specialist.dto';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/exercise.dto';

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('specialists')
  specialists() {
    return this.admin.specialists();
  }

  @Post('specialists')
  @HttpCode(HttpStatus.CREATED)
  createSpecialist(@Body() dto: CreateSpecialistDto) {
    return this.admin.createSpecialist(dto);
  }

  @Patch('users/:id/role')
  setUserRole(@Param('id') id: string, @Body() dto: SetUserRoleDto) {
    return this.admin.setUserRole(id, dto);
  }

  @Get('parents')
  parents() {
    return this.admin.parents();
  }

  @Get('children')
  children() {
    return this.admin.children();
  }

  @Get('children/:id')
  childDetail(@Param('id') id: string) {
    return this.admin.childDetail(id);
  }

  @Post('children/:id/assignments')
  @HttpCode(HttpStatus.CREATED)
  addAssignment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddAssignmentDto,
  ) {
    return this.admin.addAssignment(user, id, dto);
  }

  @Post('children/:id/notes')
  @HttpCode(HttpStatus.CREATED)
  addNote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
  ) {
    return this.admin.addNote(user, id, dto);
  }

  @Get('assignments')
  assignments() {
    return this.admin.assignments();
  }

  @Get('diagnostics')
  diagnostics() {
    return this.admin.diagnostics();
  }

  @Get('content')
  content() {
    return this.admin.content();
  }

  @Post('exercises')
  @HttpCode(HttpStatus.CREATED)
  createExercise(@Body() dto: CreateExerciseDto) {
    return this.admin.createExercise(dto);
  }

  @Patch('exercises/:id')
  updateExercise(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.admin.updateExercise(id, dto);
  }

  @Delete('exercises/:id')
  deleteExercise(@Param('id') id: string) {
    return this.admin.deleteExercise(id);
  }

  @Get('analytics')
  analytics() {
    return this.admin.analytics();
  }

  @Post('notifications')
  @HttpCode(HttpStatus.CREATED)
  sendNotification(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendNotificationDto) {
    return this.admin.sendNotification(user, dto);
  }

  @Get('notifications')
  listNotifications() {
    return this.admin.listNotifications();
  }
}
