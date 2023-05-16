"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditProfileController = void 0;
const common_1 = require("@nestjs/common");
const user_entity_1 = require("../user.entity");
const auth_guard_1 = require("../../auth/auth.guard");
const edit_profile_service_1 = require("./edit-profile.service");
const user_decorator_1 = require("../user.decorator");
let EditProfileController = class EditProfileController {
    edit(user, id) {
        return (this.service.editProfile(user, id));
    }
};
__decorate([
    (0, common_1.Inject)(edit_profile_service_1.EditProfileService),
    __metadata("design:type", edit_profile_service_1.EditProfileService)
], EditProfileController.prototype, "service", void 0);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Post)('user/edit'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.UserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, Number]),
    __metadata("design:returntype", Promise)
], EditProfileController.prototype, "edit", null);
EditProfileController = __decorate([
    (0, common_1.Controller)('edit-profile')
], EditProfileController);
exports.EditProfileController = EditProfileController;
//# sourceMappingURL=edit-profile.controller.js.map