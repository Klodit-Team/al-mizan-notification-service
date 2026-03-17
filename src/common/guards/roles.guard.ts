import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const rolesHeader = request.headers['x-user-roles'] as string;
    let userRoles: string[] = [];
    if (rolesHeader) {
      try { userRoles = JSON.parse(rolesHeader); } catch { userRoles = [rolesHeader]; }
    }
    if (!userRoles.some((r) => required.includes(r))) {
      throw new ForbiddenException(`Accès refusé. Rôles requis : ${required.join(', ')}`);
    }
    return true;
  }
}
