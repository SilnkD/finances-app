import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    forwardRef(()=>UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('PRIVATE_KEY') || 'SECRET',
        signOptions: {
          expiresIn: '2h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [AuthService, JwtModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}