import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../database/models/users.model';
import { AuthModule } from 'src/auth/auth.module';
import { UserCategory } from 'src/database/models/user-categories.model';
import { Category } from 'src/database/models/categories.model';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  controllers: [UsersController],
  providers: [UsersService,
      {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    ],
  imports: [
    SequelizeModule.forFeature([User, Category, UserCategory]),
    forwardRef(()=>AuthModule)
  ],
  exports: [
    UsersService,
  ]
})
export class UsersModule {}
