import { Component } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})

export class ChatComponent {

	constructor(private chatService: ChatService) {}
//	ngOnInit(): void {
//		this.chatService.sendMessage("capullo");
//		console.log(this.chatService.getMessage());
//	}
	sendMessage(): void{
		this.chatService.sendMessage("capullo");
		console.log(this.chatService.getMessage());
	}

}
