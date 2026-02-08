import {
    Controller,
    Post,
    Body,
    Get,
    Delete,
    UseGuards,
    Req,
    Res,
    HttpCode,
    HttpStatus,
    Param,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from '@aeo-live/shared';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const result = await this.authService.register(dto);
        return {
            success: true,
            data: result,
        };
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto);
        return {
            success: true,
            data: result,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refreshTokens(@Body() dto: RefreshTokenDto) {
        const tokens = await this.authService.refreshTokens(dto.refreshToken);
        return {
            success: true,
            data: { tokens },
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser() user: AuthUser, @Body() body: { refreshToken?: string }) {
        await this.authService.logout(user.id, body.refreshToken);
        return {
            success: true,
            data: { message: 'Logged out successfully' },
        };
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        await this.authService.forgotPassword(dto.email);
        return {
            success: true,
            data: { message: 'If that email exists, a reset link has been sent' },
        };
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto) {
        await this.authService.resetPassword(dto.token, dto.password);
        return {
            success: true,
            data: { message: 'Password reset successfully' },
        };
    }

    @Get('verify-email/:token')
    async verifyEmail(@Param('token') token: string, @Res() res: Response) {
        await this.authService.verifyEmail(token);
        // Redirect to frontend success page
        return res.redirect(`${process.env.WEB_URL}/auth/email-verified`);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getMe(@CurrentUser() user: AuthUser) {
        return {
            success: true,
            data: { user },
        };
    }

    @Delete('account')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteAccount(@CurrentUser() user: AuthUser) {
        await this.authService.deleteAccount(user.id);
        return {
            success: true,
            data: { message: 'Account deleted successfully' },
        };
    }

    // Google OAuth
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    async googleAuth() {
        // Guard redirects to Google
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    async googleAuthCallback(@Req() req: { user: { user: AuthUser; tokens: { accessToken: string; refreshToken: string } } }, @Res() res: Response) {
        const { tokens } = req.user;
        // Redirect to frontend with tokens
        const params = new URLSearchParams({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
        return res.redirect(`${process.env.WEB_URL}/auth/callback?${params.toString()}`);
    }

    // TODO: Add Microsoft OAuth routes when credentials are provided
}
