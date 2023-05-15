import { 
	OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';

//this base class is used to log the initialization
//and avoid code duplications in the gateways
export class BaseGateway implements OnGatewayInit {

  private readonly logger; 
  gatewayName: string;

  constructor(name: string){
	this.gatewayName = name;
	this.logger = new Logger(this.gatewayName);
  }

  afterInit(): void {
	this.logger.log(this.gatewayName + ' initialized');
  }
 
}
