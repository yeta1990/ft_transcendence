import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'module-alias/register';
import { config }  from 'dotenv'; 

config(); // to load process.env from here

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: [process.env.FRONTEND_IP, 'http://localhost:3000', 'http://localhost:4200'],
		methods: 'GET,PUT,POST,DELETE',
		allowedHeaders: 'Content-Type, Authorization',
	});

	await app.listen(3000);
}
bootstrap();
