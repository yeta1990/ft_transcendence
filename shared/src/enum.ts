export const enum UserStatus {
	OFFLINE,
	ONLINE,
	LOBBY,
	PLAYING,
	SPECTATING
}

export const enum ChannelRole {
	USER,
	MODERATOR,
	ADMINISTRATOR
}

export const enum ChannelType {
	PUBLIC,
	PRIVATE,
	ANNOUNCEMENT,
	PERSONAL_MESSAGE
}

export enum Achievement {
	NONE,
	BEGINNERS_LUCK, // Win your first multiplayer match. Desc: Win a multiplayer match in pong against another player.
	FLAWLESS_VICTORY, // Win a match without allowing the opponent to score a single point. Desc: Defeat your opponent with a score of 10-0 in a multiplayer match.
	SPEED_DEMON, // Win a match in the shortest possible time. Desc: Finish a multiplayer match in the shortest time possible, for example, less than 2 minutes.
	QUICK_REFLEXES, // Achieve a streak of successful consecutive hits without missing. Desc: Successfully hit the ball back to your opponent without missing for a streak of 10 hits in a multiplayer match.
	RISING_STAR, // Achieve a winning streak of 5 matches in a row. Desc:  Win five consecutive multiplayer matches without losing any.
}
