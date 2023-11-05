import { Component } from '@angular/core';
import { AllUsersService } from '../all-users/all-users.service';
import { User } from '../user'
import { Subscription } from "rxjs"
import { ToasterService } from '../toaster/toaster.service'
import { ModalService } from '../modal/modal.service'
import { AdminPageService} from './admin-page.service' 
import { ChatService } from '../chat/chat.service'

@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.component.html',
  styleUrls: ['./admin-page.component.css']
})
export class AdminPageComponent {
	allUsers: User[] = [];	
	private modalClosedSubscription: Subscription = {} as Subscription;
	constructor(private allUsersService: AllUsersService, 
				private adminPageService: AdminPageService,
		private modalService: ModalService,
		private toasterService: ToasterService,
		private chatService: ChatService
			   ) {

		this.allUsersService.getUsers()
			.subscribe(
				(response:User[]) => {this.allUsers = response; console.log(response)})
		this.chatService.forceInit()
	}

	grantAdminModal(login: string, userRole: number){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm) this.changeUserRole(login, userRole);
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template10', login);
	}

	removeAdminModal(login: string, userRole: number){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm) this.changeUserRole(login, userRole);
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template11', login);
	}
	
	banUserModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm) this.banUser(login);
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template12', login);
	}

	removeBanUserModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm) this.removeBanUser(login);
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template13', login);
	}

	changeUserRole(login: string, userRole:number) {
    	if (userRole < 5){
			this.adminPageService.grantAdminPrivileges(login)
			.subscribe(
				(response:User[]) => {this.allUsers = response; console.log(response)})
		} else if (userRole === 5){
			this.adminPageService.removeAdminPrivileges(login)
			.subscribe(
				(response:User[]) => {this.allUsers = response; console.log(response)})
		}
	}

	banUser(login: string) {
		this.adminPageService.banUser(login)
			.subscribe(
				(response:User[]) => {this.allUsers = response; console.log(response)})
		this.chatService.kickUser(login)
	}

	removeBanUser(login: string) {
		this.adminPageService.removeBanUser(login)
			.subscribe(
				(response:User[]) => {this.allUsers = response; console.log(response)})
	}



}
