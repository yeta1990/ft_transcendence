import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './achievement.entity';
import { AchievementsData } from '@shared/achievement'; // Asegúrate de tener la ruta correcta

@Injectable()
export class AchievementService implements OnModuleInit {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepository: Repository<Achievement>,
  ) {}

  async onModuleInit() {
    await this.seedAchievements();
  }

  async seedAchievements() {
    const existingAchievements = await this.achievementRepository.find();

    for (const achievementData of AchievementsData) {
      const existingAchievement = existingAchievements.find(
        (achievement) => achievement.name === achievementData.name,
      );

      if (!existingAchievement) {
        const newAchievement = this.achievementRepository.create(achievementData);
        await this.achievementRepository.save(newAchievement);
      }
    }
  }
  	public async getAchievementByName(name: string): Promise<Achievement | undefined>{
		const achievement = await this.achievementRepository.findOne({
			where: {
				name: name
			}
		})
		return achievement
  	}

}
