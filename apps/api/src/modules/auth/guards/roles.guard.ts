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
            return true; // No roles required
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            return false;
        }

        // Check if user has any of the required roles
        const userRole = user.role?.toUpperCase() || '';

        // Super admin bypass - check if email is in SUPER_ADMIN_EMAILS
        const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
        if (superAdminEmails.includes(user.email?.toLowerCase())) {
            return true;
        }

        // Check role match
        return requiredRoles.some((role) => {
            const upperRole = role.toUpperCase();
            // OWNER and ADMIN both count as admin roles
            if (upperRole === 'ADMIN' && (userRole === 'ADMIN' || userRole === 'OWNER')) {
                return true;
            }
            return userRole === upperRole;
        });
    }
}
