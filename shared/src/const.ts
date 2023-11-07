
export const events = {
	ListMyJoinedRooms: "listMyJoinedRooms",
	ListMyPrivateRooms: "listMyPrivateRooms",
	ListAllRooms: "listAllRooms",
	Pass: "pass",
	RemovePass: "nopass",
	RoomMetaData: "roomMetaData",
	AllRoomsMetaData: "allRoomsMetaData",
	ActiveUsers: "activeUsers",
	SoftDisconnect: "softDisconnect",
	BlockedUsers: "blockedUsers",
	SilenceUser: "silence",
	UnSilenceUser: "nosilence",
	KickUser: "kickUser",
	Kicked: "kicked",
	AllHistoricalMessages: "allHistoricalMessages",
	AdminJoin: "adminJoin",
	AdminBanChatUser: "adminBanUser",
	AdminRemoveBanChatUser: "adminRemoveBanUser",
	AdminSilenceChatUser: "adminSilenceUser",
	AdminRemoveSilenceChatUser: "adminRemoveSilenceUser",
	AdminGiveAdminChatPrivileges: "adminGiveAdminChatPrivileges",
	AdminRevokeAdminChatPrivileges: "adminRevokeAdminChatPrivileges",
	AdminGiveChatOwnership: "adminGiveChatOwnership",
	AdminRevokeChatOwnership: "adminRevokeChatOwnership",
	AdminDestroyChannel: "adminDestroyChannel",
	MessageForWebAdmins: "messageForWebAdmins"
}

export const values = {
	forbiddenChatRoomCharacters: [':', '#', '@']
}

export const ToastValues = {
	INFO: "Information",
	SUCCESS: "Success",
	WARNING: "Warning",
	ERROR: "Error"
}
