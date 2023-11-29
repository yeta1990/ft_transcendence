import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../user';
import { UserProfileService } from './user-profile.service';
import { AuthService } from '../auth/auth.service';
import { Campuses, EloRank } from '@shared/enum';
import { getEloRank } from '@shared/functions';
import { Achievement, AchievementsData } from '@shared/achievement'
import { forkJoin } from 'rxjs';
import { Location } from '@angular/common';
import { UserModule } from '../user/user.module';
import {ChatService} from '../chat/chat.service'
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';


@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  user: User | undefined;
  adminPower = false; // HAY QUE AÑADIR QUE UN ADMIN PUEDA EDITAR TAMBIEN
  campusesTypes = Object.values(Campuses);
  gradientStart = 0;
  gradientEnd = 0;
  userRank: string = '';
  userAchievements: Achievement[] = [];
  totalAchievements: number = AchievementsData.length;
  allAchievements: Achievement[] = AchievementsData;
  achievementsStatus: { name: string; achieved: boolean }[] = [];
  editingField: string | null = null;
  editedFields: { [key: string]: any } = {};
  myLogin: string;
  myIncomingFriendRequests: Array<string> = [];
  imagesBaseUrl: string = environment.apiUrl + '/uploads/'
  loaded: boolean = false;
  found: boolean = true;
  games: any = {}

  constructor(
		private profileService: UserProfileService,
		private authService: AuthService,
		private router: Router,
    	private activateroute: ActivatedRoute,
		private location: Location,
		private chatService: ChatService,
		private httpClient: HttpClient
	) {
		this.myLogin = this.authService.getDecodedAccessToken(this.authService.getUserToken()!).login;
		const currentID = this.authService.getDecodedAccessToken(this.authService.getUserToken()!).id;
		this.profileService.getMyIncomingFriendRequests(currentID).subscribe((fr: User) => this.myIncomingFriendRequests = fr.incomingFriendRequests)
	}

	allUsers(): void {
		console.log("All users login list:");
		this.router.navigateByUrl('/all-users');
	}

	ngOnInit() {
		this.activateroute.paramMap.subscribe(params => {
			const login = params.get('login');
			if (login !== null) {
			  this.loadUserData(login);
			}
		  });
	  }


	  loadUserData(login: string) {
		this.profileService.getUserIDByLogin(login).subscribe((userId: number) => {
		  if (userId === -1) {
			this.found = false;
			return;
		  }
		  forkJoin([
			this.profileService.getUserProfile(userId),
			this.profileService.getUserAchievements(userId),
			this.profileService.getMyBlockedUsers(),
			this.profileService.getGamesOfUser(login)
		]).subscribe(([userProfile, userAchievements, blockedUsers, games]: [User, Achievement[], Array<any>, any]) => {
			this.user = userProfile;
			this.userAchievements = userAchievements;
			console.log('User:', this.user);
			console.log('User Achievements:', this.userAchievements);
			this.calculateProgressStyles(this.user);
			this.achievementsStatus = this.getAchievementsStatus();
			console.log('ALL Achievements:', this.achievementsStatus);
			this.chatService.setMyBlockedUsers(blockedUsers);
			this.check_admin_level(userId);
			this.loaded = true;
			this.games = games
		});
		});
	  }

	  check_admin_level(userId: number) {
		const currentID = this.authService.getDecodedAccessToken(this.authService.getUserToken()!).id;
		if (currentID == userId)
			this.adminPower = true;
	  }

	  editField(fieldName: string): void {
		if (this.user && this.adminPower) {
		  this.editingField = fieldName;
		  this.editedFields[fieldName] = this.user[fieldName as keyof User];
		  }
		}
		
	
	  isBlocked(): boolean {
	  	  if (this.user){
				return this.chatService.getMyBlockedUsers().includes(this.user!.login)
		  }
		  return false;
	  }

	  async blockUser(login:string) {
		this.profileService.blockUser(login)
			.subscribe(users => 
				this.chatService.setMyBlockedUsers(users)
			)
	  }

	  async unBlockUser(login:string) {
		this.profileService.unBlockUser(login)
			.subscribe(users => 
				this.chatService.setMyBlockedUsers(users)
			)
	  }

	  progressStyles: { [key: string]: string } = {};

	  calculateProgressStyles(user: User): void {
		const totalMatches = user.wins + user.losses;
		let loosePercentage = 50;
		
		if (totalMatches !== 0) {
			loosePercentage = (user.losses / totalMatches) * 100;
		}

		this.gradientStart = Math.max(0, loosePercentage - 10); // Limitando entre 0 y 100
		this.gradientEnd = Math.min(100, loosePercentage + 10); // Limitando entre 0 y 100;

		this.userRank = getEloRank(user.elo);
		console.log('ELO Rank:', this.userRank);

		const minElo = EloRank.Principiante;
		const maxElo = EloRank.Maestro;
		const progressPercentage = ((user.elo - minElo) / (maxElo - minElo)) * 100;

		 // Asegurarse de que el progreso mínimo sea del 10%
		 const minProgressPercentage = 10;
		 const finalProgressPercentage = Math.max(minProgressPercentage, progressPercentage);

		 console.log(finalProgressPercentage);
		this.progressStyles = {
			'--progress-width': `${finalProgressPercentage}%`
		  };
	  }

	  getAchievementsStatus(): any[] {
		const achievementsStatus = [];
		for (const achievement of AchievementsData) {
		  const hasAchievement = this.userAchievements.some(userAchievement => userAchievement.name === achievement.name);
		  achievementsStatus.push({ name: achievement.name, achieved: hasAchievement });
		}
		return achievementsStatus;
	  }

	  goEdit(): void {
		if (this.user) {
		  const login = this.user.login; // Obtén el login del usuario actual
		  this.router.navigate(['/user-profile', login, 'edit']); // Carga la URL ":login/edit"
		}
	  }
	  
	  goBack(): void {
		this.location.back(); // Navegar a la página anterior
	}
	
	sendFriendShipRequest(login:string){
		return this.profileService.sendFriendShipRequest(login)
			.subscribe(r => {if (r) this.user!.incomingFriendRequests.push(this.myLogin)})
	}

	acceptFriendShipRequest(login:string){
		return this.profileService.acceptFriendShipRequest(login)
			.subscribe(r => {
				if (r) {
					this.user!.incomingFriendRequests = this.user!.incomingFriendRequests.filter(l => l != this.myLogin)
					this.myIncomingFriendRequests = this.myIncomingFriendRequests.filter(l => l != login)
					this.user!.friends.push(this.myLogin)
				}
			})
	}

	rejectFriendshipRequest(login:string){
		return this.profileService.rejectFriendshipRequest(login)
			.subscribe(r => {
				if (r) {
					this.user!.incomingFriendRequests = this.user!.incomingFriendRequests.filter(l => l != this.myLogin)
					this.myIncomingFriendRequests = this.myIncomingFriendRequests.filter(l => l != login)
				}
			})
	}

	removeFriendship(login:string) {
		return this.profileService.removeFriendship(login)
			.subscribe(r => {if (r){
				this.user!.friends = this.user!.friends.filter(f => f != this.myLogin)
				this.myIncomingFriendRequests = this.myIncomingFriendRequests.filter(l => l != login)
	 			}
			} )
	}
}
