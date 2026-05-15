import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '../types/role';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  avatarLetter: string;
  title: string | null;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
