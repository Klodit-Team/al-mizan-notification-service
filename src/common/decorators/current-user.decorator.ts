import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'] as string;
    const rolesHeader = request.headers['x-user-roles'] as string;
    let roles: string[] = [];
    if (rolesHeader) {
      try { roles = JSON.parse(rolesHeader); } catch { roles = [rolesHeader]; }
    }
    return { id: userId, roles };
  },
);
