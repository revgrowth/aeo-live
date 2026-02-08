import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard - allows unauthenticated requests but attaches user if token present
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        // Call parent to attempt authentication
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any) {
        // Don't throw on error - just return null user
        return user || null;
    }
}
