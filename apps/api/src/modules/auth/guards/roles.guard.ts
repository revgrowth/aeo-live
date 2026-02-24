import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No roles required — any authenticated user can access
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            return false;
        }

        const userRole = (user.role || '').toUpperCase();

        // SUPER_ADMIN always has access to everything
        if (userRole === 'SUPER_ADMIN') {
            return true;
        }

        // Fallback: check by SUPER_ADMIN_EMAILS env var
        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '')
            .split(',')
            .map(e => e.trim().toLowerCase())
            .filter(Boolean);
        if (superAdminEmails.includes(user.email?.toLowerCase())) {
            return true;
        }

        // Direct role match.
        // Roles are: SUPER_ADMIN, ADMIN, USER, VIEWER
        // Legacy OWNER/MEMBER are treated as USER for most purposes,
        // but we also check the raw role so legacy OWNER accounts
        // still pass guards that explicitly list OWNER during migration.
        const effectiveRole = (userRole === 'OWNER' || userRole === 'MEMBER') ? 'USER' : userRole;
        return requiredRoles.some(role => {
            const upper = role.toUpperCase();
            return upper === effectiveRole || upper === userRole;
        });
    }
}
