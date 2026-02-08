import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@aeo-live/shared';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    async getProfile(@CurrentUser() user: AuthUser) {
        const profile = await this.usersService.findById(user.id);
        return {
            success: true,
            data: profile,
        };
    }

    @Patch('profile')
    async updateProfile(
        @CurrentUser() user: AuthUser,
        @Body() body: { name?: string; avatarUrl?: string }
    ) {
        const updated = await this.usersService.updateProfile(user.id, body);
        return {
            success: true,
            data: updated,
        };
    }
}
