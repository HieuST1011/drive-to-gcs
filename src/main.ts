import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(
    session({
      secret: 'drivetogcs',
      saveUninitialized: false,
      resave: false,
      cookie: {
        maxAge: 60000,
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:3000', // Change to your frontend URL
    credentials: true, // Allow cookies to be sent
  });

  await app.listen(3000);
}
bootstrap();
