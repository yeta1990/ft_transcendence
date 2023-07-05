import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePost1685730565601 implements MigrationInterface {
    name = 'CreatePost1685730565601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "friend" ("id" SERIAL NOT NULL, "friendName" character varying NOT NULL, CONSTRAINT "PK_1b301ac8ac5fcee876db96069b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "achievement" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, CONSTRAINT "PK_441339f40e8ce717525a381671e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "achievement_users_user" ("achievementId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_34d9a2b2723b999b5eb4b7ff36b" PRIMARY KEY ("achievementId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_adbfd622a44951248bbf123e39" ON "achievement_users_user" ("achievementId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a52c2f17eadac5b488d7c9a649" ON "achievement_users_user" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_achievements_achievement" ("userId" integer NOT NULL, "achievementId" integer NOT NULL, CONSTRAINT "PK_de5198701472166889507ed4d9e" PRIMARY KEY ("userId", "achievementId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_454df42d94ff4f901b4a2673e6" ON "user_achievements_achievement" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9d243f5af5248715ac8c4810dc" ON "user_achievements_achievement" ("achievementId") `);
        await queryRunner.query(`CREATE TABLE "user_friends" ("user_id" integer NOT NULL, "friend_id" integer NOT NULL, CONSTRAINT "PK_657d2355d5000f103ff3612447f" PRIMARY KEY ("user_id", "friend_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_73aac2cba30951ed7c7000c614" ON "user_friends" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_24f1e41a3801477d44228395e3" ON "user_friends" ("friend_id") `);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "mfaSecret"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "achievements"`);
        await queryRunner.query(`DROP TYPE "public"."user_achievements_enum"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "winningstreak"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "winningStreak" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "achievement_users_user" ADD CONSTRAINT "FK_adbfd622a44951248bbf123e397" FOREIGN KEY ("achievementId") REFERENCES "achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "achievement_users_user" ADD CONSTRAINT "FK_a52c2f17eadac5b488d7c9a6490" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_achievements_achievement" ADD CONSTRAINT "FK_454df42d94ff4f901b4a2673e66" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_achievements_achievement" ADD CONSTRAINT "FK_9d243f5af5248715ac8c4810dc5" FOREIGN KEY ("achievementId") REFERENCES "achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_friends" ADD CONSTRAINT "FK_73aac2cba30951ed7c7000c6142" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_friends" ADD CONSTRAINT "FK_24f1e41a3801477d44228395e3b" FOREIGN KEY ("friend_id") REFERENCES "friend"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_friends" DROP CONSTRAINT "FK_24f1e41a3801477d44228395e3b"`);
        await queryRunner.query(`ALTER TABLE "user_friends" DROP CONSTRAINT "FK_73aac2cba30951ed7c7000c6142"`);
        await queryRunner.query(`ALTER TABLE "user_achievements_achievement" DROP CONSTRAINT "FK_9d243f5af5248715ac8c4810dc5"`);
        await queryRunner.query(`ALTER TABLE "user_achievements_achievement" DROP CONSTRAINT "FK_454df42d94ff4f901b4a2673e66"`);
        await queryRunner.query(`ALTER TABLE "achievement_users_user" DROP CONSTRAINT "FK_a52c2f17eadac5b488d7c9a6490"`);
        await queryRunner.query(`ALTER TABLE "achievement_users_user" DROP CONSTRAINT "FK_adbfd622a44951248bbf123e397"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "winningStreak"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "winningstreak" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."user_achievements_enum" AS ENUM('0', '1', '2', '3', '4', '5')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "achievements" "public"."user_achievements_enum" array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "mfaSecret" character varying`);
        await queryRunner.query(`DROP INDEX "public"."IDX_24f1e41a3801477d44228395e3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_73aac2cba30951ed7c7000c614"`);
        await queryRunner.query(`DROP TABLE "user_friends"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d243f5af5248715ac8c4810dc"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_454df42d94ff4f901b4a2673e6"`);
        await queryRunner.query(`DROP TABLE "user_achievements_achievement"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a52c2f17eadac5b488d7c9a649"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_adbfd622a44951248bbf123e39"`);
        await queryRunner.query(`DROP TABLE "achievement_users_user"`);
        await queryRunner.query(`DROP TABLE "achievement"`);
        await queryRunner.query(`DROP TABLE "friend"`);
    }

}
