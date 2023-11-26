import { Component, Input } from '@angular/core';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { SocketPayload } from '@shared/types'
import { events } from '@shared/const';
import { AuthGuardService } from '../../auth/auth-guard.service';
import { ChatService } from '../../chat/chat.service'
import { ModalService } from '../../modal/modal.service'
import { Subscription } from "rxjs"
import { Location } from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent {

  @Input() public isUserLogged: boolean;

	private modalClosedSubscription: Subscription = {} as Subscription;

	private subscriptions = new Subscription();
	userName: string = "";
   constructor(
       private authService: AuthService,
       private authGuardService: AuthGuardService,
       private router: Router,
      private chatService: ChatService,
	   private modalService: ModalService,
	   private location: Location
    ) {
      this.userName = this.authService.getUserNameFromToken() as string;
      this.isUserLogged = authService.isLoggedIn();
	  this.chatService.forceInit()    
	  this.subscriptions.add(
		this.chatService
			.getMessage()
			.subscribe((payload: SocketPayload) => {
				if (payload.event === events.ActiveUsers){
					this.chatService.setActiveUsers(payload.data)
				}
				else if (payload.event === "sendMatchProposal"){
					console.log("receiving match")
					this.receiveMatchModal(payload.data)	
				}
				else if (payload.event === "cancelMatchProposal"){
					console.log("cancel match")
					this.modalService.closeModal();
				}
				else if (payload.event === "acceptMatchProposal"){
					this.modalService.closeModal();
					if (!this.location.path().includes('home')){
	  					this.router.navigateByUrl('/home');
					}
				}
				else if (payload.event === 'replayGameProposal'){
					this.replayModal(payload.data)
//					this.modalService.closeModal()
				}
				else if (payload.event === 'cancelOnline'){
					this.modalService.closeModal()
				}
		})
	  )
    }


  getUserStatus(){
	return this.chatService.getUserStatus(this.userName)
  }

  logout() {
    this.authService.logout();
  }

  hasAdminPrivileges(): boolean {
		return this.authGuardService.isAdminOrOwner()
  }

  redirectToMyProfile() {
    // Obtén el nombre de usuario del JWT

    if (this.userName) {
      this.router.navigate(['/user-profile', this.userName]);
    } else {
	  this.router.navigateByUrl('/home');
    }
  }

  redirectTo(path: string){
	this.router.navigateByUrl(path);
  }
  redirectToFriends() {
	this.router.navigateByUrl('/friends');
  }

  redirectToGame() {
      this.router.navigateByUrl('/play');
  }

  redirectToAdmin() {
      this.router.navigateByUrl('/admin');
  }

  redirectToChatAdmin() {
      this.router.navigateByUrl('/admin-chat');
  }

	rejectReplayProposal(login: string){
		this.chatService.rejectReplayProposal(login)
	}
	sendReplayProposal(login: string){
		this.chatService.sendReplayProposal(login)
	}


	receiveMatchModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
      		if (confirm){
      			const challengeConfirmation = this.modalService.getModalData()[0];
				this.chatService.acceptMatchProposal(login)
			}
			else{
				this.chatService.cancelMatchProposal(login)
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template14', login);
	}
	waitForReplayMatchAnswerModal(login: string){
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
			this.chatService.cancelMatchProposal(login)
			console.log("cancel match proposal")
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template15', login);
	}
 
	replayModal(login: string): void {
		this.modalClosedSubscription = this.modalService.modalClosed$.subscribe(() => {
      		const confirm: boolean = this.modalService.getConfirmationInput();
			const wantToReplay = this.modalService.getModalData()[0];
			console.log(wantToReplay)
      		if (confirm){
      			this.sendReplayProposal(login)
				this.waitForReplayMatchAnswerModal(login)
			}
			else if (wantToReplay== "no"){
				this.rejectReplayProposal(this.chatService.getCurrentRoom())
			}
			this.modalClosedSubscription.unsubscribe();
    	});
		this.modalService.openModal('template19', login);
	}


}
