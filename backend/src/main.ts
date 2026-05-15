import 'reflect-metadata';
import { networkInterfaces } from 'os';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Tashqi (IPv4, non-loopback) interfeyslar — telefon va boshqa LAN qurilmalari
// shu manzillardan birorta orqali backend'ga ulanadi.
function lanAddresses(): string[] {
  const out: string[] = [];
  const nets = networkInterfaces();
  for (const list of Object.values(nets)) {
    if (!list) continue;
    for (const net of list) {
      if (net.family === 'IPv4' && !net.internal) {
        out.push(net.address);
      }
    }
  }
  return out;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  // JSON body size — avatar data URL'lari uchun (default 100kb yetishmaydi)
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ limit: '5mb', extended: true }));

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const port = config.get<number>('port') ?? 3001;
  const configuredOrigins = (config.get<string>('cors.origins') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // CORS — sozlangan kelib chiqishlarga + barcha mahalliy tarmoq interfeyslari
  // uchun development portlariga + Capacitor (Android/iOS) WebView origin'lariga ochiq.
  const devPorts = [3000, 4173, 5173, 5174, 5175, 8080];
  const dynamicOrigins = lanAddresses().flatMap((ip) =>
    devPorts.map((p) => `http://${ip}:${p}`),
  );
  // Capacitor APK ichidagi WebView quyidagi origin'lardan birortasini yuboradi:
  //   Android (default androidScheme="https"): https://localhost
  //   Android (legacy / http):                  http://localhost
  //   iOS:                                      capacitor://localhost
  // Origin yuborilmasligi ham mumkin (null) — bu holatda CORS tekshirilmaydi.
  const capacitorOrigins = [
    'https://localhost',
    'http://localhost',
    'capacitor://localhost',
    'ionic://localhost',
  ];
  const allOrigins = [
    ...new Set([...configuredOrigins, ...dynamicOrigins, ...capacitorOrigins]),
  ];

  app.enableCors({
    // Callback shakli — `origin === undefined` (mobil WebView ba'zan Origin
    // header yubormaydi) holatini ham ruxsat etadi.
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: origin ${origin} ruxsat etilmagan`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['content-type', 'authorization'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // 0.0.0.0 — telefon, planshet va boshqa qurilmalar uchun LAN orqali ochiq.
  // Faqat localhost'dan ulanish uchun '127.0.0.1' ga o'zgartiring.
  await app.listen(port, '0.0.0.0');
  logger.log('Hearek API tayyor:');
  logger.log(`  → http://localhost:${port}/api`);
  for (const ip of lanAddresses()) {
    logger.log(`  → http://${ip}:${port}/api`);
  }
}

bootstrap();
