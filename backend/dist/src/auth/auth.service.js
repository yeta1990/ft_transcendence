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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../user/user.service");
const jwt_1 = require("@nestjs/jwt");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let AuthService = class AuthService {
    constructor(userService, jwtService, httpService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.httpService = httpService;
    }
    async confirmAuthFrom42(code) {
        const data = await (0, rxjs_1.lastValueFrom)(this.httpService.post('https://api.intra.42.fr/oauth/token', null, { params: {
                grant_type: 'authorization_code',
                host: process.env.POSTGRES_HOST,
                client_id: process.env.CLIENT_ID_42,
                client_secret: process.env.CLIENT_SECRET_42,
                code: code,
                redirect_uri: process.env.REDIRECT_URI_42
            }
        })
            .pipe((0, rxjs_1.map)(res => res.data)));
        return data;
    }
    async signIn(code) {
        let data;
        try {
            data = await this.confirmAuthFrom42(code);
        }
        catch (error) {
            throw new common_1.UnauthorizedException();
        }
        const allUserData42 = await this.userService.whoAmI(data.access_token);
        const payloadToCreateUser = { nick: allUserData42.login, email: allUserData42.email, firstName: allUserData42.first_name, lastName: allUserData42.last_name, login: allUserData42.login, image: allUserData42.image.versions.medium };
        const createdUser = await this.userService.createUser(payloadToCreateUser);
        const payloadToSign = { nick: createdUser.nick, id: createdUser.id };
        const access_token = await this.jwtService.signAsync(payloadToSign);
        const decoded = this.jwtService.decode(access_token);
        return {
            access_token: access_token,
            expires_at: decoded.exp * 1000,
        };
    }
    getIdFromJwt(token) {
        const decoded = this.jwtService.decode(token);
        return parseInt(decoded.id);
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        axios_1.HttpService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map