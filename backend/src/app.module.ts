import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ChildrenModule } from './modules/children/children.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ProgressModule } from './modules/progress/progress.module';
import { DiagnosticsModule } from './modules/diagnostics/diagnostics.module';
import { ChatModule } from './modules/chat/chat.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { SpeechChecksModule } from './modules/speech-checks/speech-checks.module';
import { GamesModule } from './modules/games/games.module';
import { RiskModule } from './modules/risk/risk.module';
import { SpecialistModule } from './modules/specialist/specialist.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: Number(process.env.RATE_LIMIT_TTL ?? 60) * 1000,
          limit: Number(process.env.RATE_LIMIT_MAX ?? 120),
        },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ChildrenModule,
    ExercisesModule,
    ProgressModule,
    DiagnosticsModule,
    ChatModule,
    AssignmentsModule,
    SpeechChecksModule,
    GamesModule,
    RiskModule,
    SpecialistModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
