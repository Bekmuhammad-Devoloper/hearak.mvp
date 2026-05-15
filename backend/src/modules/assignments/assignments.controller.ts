import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

import { AssignmentsService } from './assignments.service';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get('children/:id/assignments')
  list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.assignments.listForChild(user, id);
  }

  @Patch('assignments/:assignmentId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('assignmentId') assignmentId: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignments.update(user, assignmentId, dto);
  }
}
