import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'not-configured',
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'not-configured',
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
    ): Promise<void> {
        const { id, emails, displayName, photos } = profile;

        const email = emails?.[0]?.value;
        if (!email) {
            done(new Error('No email provided from Google'), undefined);
            return;
        }

        try {
            const result = await this.authService.validateOAuthUser({
                provider: 'google',
                providerId: id,
                email,
                name: displayName,
                avatarUrl: photos?.[0]?.value,
            });

            done(null, result);
        } catch (error) {
            done(error as Error, undefined);
        }
    }
}
