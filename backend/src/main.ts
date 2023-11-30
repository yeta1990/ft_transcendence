import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config }  from 'dotenv'; 


config(); // to load process.env from here

function isOriginAllowed(origin: string) {
	const allowedOrigins = ['http://localhost', 'http://localhost:80','http://localhost:3000', process.env.FRONTEND_IP, process.env.FRONTEND_IP2];
	const allowedLastDigits = ['1', '2', '3', '4', '5', '6']; // Últimos dígitos permitidos
	const portsToAllow = [':80'];

	// Verificamos si el origen es una URL válida
	const urlPattern = /^(https?:\/\/)?([a-z\d.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:[0-9]{1,5})?([/?].*)?$/;
	const matches = origin.match(urlPattern);
	if (!matches) {
		return false; // Si no es una URL válida, la rechazamos
	}
 
	// Verificamos si el origen es localhost
	if (allowedOrigins.includes(origin)) {
		return true;
	}
	for (let orig of allowedOrigins){
		if (orig.replace(portsToAllow[0], "").includes(origin)){
			return true
		}
	}

	if (allowedOrigins.includes(origin.replace(portsToAllow[0], ""))){
		return true;
	}
	const [, , hostname, port, path] = matches;
	
	// Dividimos la IP en sus componentes
	const ipComponents = hostname.split('.');
	if (ipComponents.length !== 4) {
	return false; // Si no tiene 4 componentes, la rechazamos
	}

	// Verificamos si la IP cumple con los criterios
	const firstComponent = ipComponents[0];
	const secondComponent = ipComponents[1];
	const thirdComponent = parseInt(ipComponents[2]);
	const lastComponent = ipComponents[3];

	if (portsToAllow.includes(port) && allowedLastDigits.includes(lastComponent) && firstComponent === '10' &&
		((secondComponent === '11' && thirdComponent >= 1 && thirdComponent <= 17) ||
		(secondComponent === '12' && thirdComponent >= 1 && thirdComponent <= 19) ||
		(secondComponent === '13' && thirdComponent >= 1 && thirdComponent <= 14))
	) {
		return true;
	}
	return false;
}

async function bootstrap() {

	const app = await NestFactory.create(AppModule);

	app.enableCors({
		
		origin: (origin, callback) => {
			if ((!origin) || isOriginAllowed(origin)) {
				callback(null, true);
			} else {
				callback(null);
			}
		}
		//methods: 'GET,PUT,POST,DELETE',
//		allowedHeaders: 'Content-Type, Authorization',
	});

	app.use((req, res, next) => {
		next();
	  });

	await app.listen(3000);
}
bootstrap();
