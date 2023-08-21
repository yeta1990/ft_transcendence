import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../user';
import { UserProfileService } from './user-profile.service';
import { AuthService } from '../auth.service';
import { Campuses, EloRank } from '@shared/enum';
import { getEloRank } from '@shared/functions';
import { Achievement, AchievementsData } from '@shared/achievement'
import { forkJoin } from 'rxjs';
import { Location } from '@angular/common';


@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  user: User | undefined;
  campusesTypes = Object.values(Campuses);
  editingField: string | null = null;
  editedFields: { [key: string]: any } = {};
  gradientStart = 0;
  gradientEnd = 0;
  userRank: string = '';
  userAchievements: Achievement[] = [];
  totalAchievements: number = AchievementsData.length;
  allAchievements: Achievement[] = AchievementsData;
  achievementsStatus: { name: string; achieved: boolean }[] = [];



  constructor(
		private profileService: UserProfileService,
		private authService: AuthService,
		private router: Router,
    	private activateroute: ActivatedRoute,
		private location: Location,
	) {}

	allUsers(): void {
		console.log("All users login list:");
		this.router.navigateByUrl('/all-users');
	}

	ngOnInit() {

		const userId = parseInt(this.activateroute.snapshot.paramMap.get('id') || '0');

		forkJoin([
			this.profileService.getUserProfile(userId),
			this.profileService.getUserAchievements(userId)
		]).subscribe(([userProfile, userAchievements]: [User, Achievement[]]) => {
			this.user = userProfile;
			this.userAchievements = userAchievements;
			console.log('User:', this.user);
			console.log('User Achievements:', this.userAchievements);
			this.calculateProgressStyles(this.user);
			this.achievementsStatus = this.getAchievementsStatus();
			console.log('ALL Achievements:', this.achievementsStatus);
		});

	  }
	  editProfile() {
		
	  }

	  editField(fieldName: string): void {
		if (this.user) {
			this.editingField = fieldName;
			this.editedFields[fieldName] = this.user[fieldName as keyof User];
		  }
	  }
	
	  saveField(fieldName: string): void {
		// Aquí debes implementar la lógica para guardar los cambios en el backend
		console.log(`Guardando campo ${fieldName}: ${this.editedFields[fieldName]}`);
		this.cancelEdit();
	  }
	
	  cancelEdit() {
		this.editingField = null;
		this.editedFields = {};
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
		console.log(AchievementsData);
		for (const achievement of AchievementsData) {
		  const hasAchievement = this.userAchievements.some(userAchievement => userAchievement.name === achievement.name);
		  achievementsStatus.push({ name: achievement.name, achieved: hasAchievement });
		}
		return achievementsStatus;
	  }
	  
	  goBack(): void {
		this.location.back(); // Navegar a la página anterior
	}
	
}
