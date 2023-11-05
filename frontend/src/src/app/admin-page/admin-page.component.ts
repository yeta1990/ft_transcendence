import { Component } from '@angular/core';
import { AllUsersService } from '../all-users/all-users.service';
import { User } from '../user'
import { Subscription } from "rxjs"
import { ToasterService } from '../toaster/toaster.service'
import { ModalService } from '../modal/modal.service'
import { AdminPageService} from './admin-page.service' 

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
		private toasterService: ToasterService) {

		this.allUsersService.getUsers()
			.subscribe(
				(response:User[]) => {this.allUsers = response; console.log(response)})
	}

	changeUserRoleModal(login: string, userRole: number){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const pass = this.modalService.getModalData()[0];
      		this.changeUserRole(login, userRole);
			this.modalClosedSubscription.unsubscribe();
    	});
    	if (userRole < 5){
			this.modalService.openModal('template10', login);
		} else if (userRole === 5){
			this.modalService.openModal('template11', login);
		}
	}
	banUserModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const pass = this.modalService.getModalData()[0];
      		this.banUser(login);
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template12', login);
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
	}




}
