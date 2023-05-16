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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const axios_1 = require("@nestjs/axios");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./user.entity");
const rxjs_1 = require("rxjs");
let UserService = class UserService {
    constructor(httpService) {
        this.httpService = httpService;
    }
    async getUser(id) {
        return this.repository.findOne({
            where: {
                id: id,
            },
        });
    }
    async getUserByNick(nick) {
        return this.repository.findOne({
            where: {
                nick: nick,
            },
        });
    }
    async createUser(body) {
        const alreadyRegisteredUser = await this.getUserByNick(body.nick);
        if (alreadyRegisteredUser)
            return (alreadyRegisteredUser);
        return this.repository.save(body);
    }
    ;
    async whoAmI(token) {
        const data = await (0, rxjs_1.lastValueFrom)(this.httpService.get('https://api.intra.42.fr/v2/me', { headers: {
                Authorization: `Bearer ${token}`,
            }
        })
            .pipe((0, rxjs_1.map)(res => res.data)));
        return data;
    }
    async getAllUsers() {
        return await this.repository.find();
    }
};
__decorate([
    (0, typeorm_1.InjectRepository)(user_entity_1.User),
    __metadata("design:type", typeorm_2.Repository)
], UserService.prototype, "repository", void 0);
UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map