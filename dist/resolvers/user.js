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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const User_1 = require("../entities/User");
const type_graphql_1 = require("type-graphql");
const UserRegisterInput_1 = require("../dto/UserRegisterInput");
const argon2_1 = __importDefault(require("argon2"));
const LoginResponse_1 = require("../dto/LoginResponse");
const constants_1 = require("../constants");
const UserLoginInput_1 = require("../dto/UserLoginInput");
const registerValidation_1 = require("../utils/registerValidation");
const sendEmail_1 = require("../utils/sendEmail");
const uuid_1 = require("uuid");
let UserResolver = class UserResolver {
    async register(userRegisterInput, { req }) {
        try {
            const errors = (0, registerValidation_1.registerValidation)(userRegisterInput);
            if (errors)
                return { errors };
            const hashPass = await argon2_1.default.hash(userRegisterInput.password);
            userRegisterInput.password = hashPass;
            const user = await User_1.User.create(Object.assign({}, userRegisterInput)).save();
            req.session.userId = user.id;
            return { user };
        }
        catch (error) {
            const uniqueErr = error.message.includes('UNIQUE');
            if (uniqueErr) {
                const nameErr = error.message.includes('user.username');
                return {
                    errors: [
                        {
                            field: nameErr ? 'username' : 'email',
                            message: nameErr
                                ? 'Username is taken!'
                                : 'Email already registered!',
                        },
                    ],
                };
            }
            throw new Error('Something went wrong. Try again!');
        }
    }
    async login({ usernameOrEmail, password }, { req }) {
        const user = await User_1.User.findOne({
            where: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
        });
        if (!user)
            return {
                errors: [
                    { field: 'usernameOrEmail', message: "The user doesn't exist" },
                ],
            };
        const valid = await argon2_1.default.verify(user.password, password);
        if (!valid)
            return {
                errors: [{ field: 'password', message: 'The password is incorrect' }],
            };
        req.session.userId = user.id;
        console.log('session: ------------------- ', req.session);
        return { user };
    }
    logout({ req, res }) {
        return new Promise((resolve) => {
            req.session.destroy((err) => {
                if (err)
                    resolve(false);
                else {
                    res.clearCookie(constants_1.COOKIE_NAME);
                    resolve(true);
                }
            });
        });
    }
    async forgotPassword(email, { redis }) {
        const token = (0, uuid_1.v4)();
        const key = constants_1.FORGOT_PASSWORD_PREFIX + token;
        try {
            const user = await User_1.User.findOneBy({ email });
            if (!user)
                return true;
            await redis.set(key, user.id, 'EX', 1000 * 60 * 60 * 24);
            await (0, sendEmail_1.sendEmail)(email, `<a href="http://localhost:3000/change-password/${token}">Reset password</a>`);
            return true;
        }
        catch (error) {
            await redis.del(key);
            return false;
        }
    }
    async changePassword(token, newPassword, { redis, req }) {
        if (newPassword.length <= 3)
            return {
                errors: [
                    {
                        field: 'newPassword',
                        message: 'length must be grater than 3',
                    },
                ],
            };
        try {
            const key = constants_1.FORGOT_PASSWORD_PREFIX + token;
            const userId = await redis.get(key);
            if (!userId)
                throw new Error('Token expired!');
            const user = await User_1.User.findOneBy({ id: parseInt(userId) });
            if (!user)
                throw new Error("Can't change password!");
            req.session.userId = user.id;
            await User_1.User.update({ id: parseInt(userId) }, { password: await argon2_1.default.hash(newPassword) });
            await redis.del(key);
            return { user };
        }
        catch (error) {
            throw new Error(error.message);
        }
    }
    me({ req }) {
        const userId = req.session.userId;
        if (!userId)
            return null;
        return User_1.User.findOneBy({ id: userId });
    }
    users() {
        return User_1.User.find();
    }
    email(root, { req }) {
        if (req.session.userId === root.id)
            return root.email;
        return 'hidden';
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => LoginResponse_1.LoginResponse),
    __param(0, (0, type_graphql_1.Arg)('userRegisterInput')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserRegisterInput_1.UserRegisterInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => LoginResponse_1.LoginResponse),
    __param(0, (0, type_graphql_1.Arg)('userLoginInput')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserLoginInput_1.UserLoginInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "logout", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    __param(0, (0, type_graphql_1.Arg)('email')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => LoginResponse_1.LoginResponse),
    __param(0, (0, type_graphql_1.Arg)('token')),
    __param(1, (0, type_graphql_1.Arg)('newPassword')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
__decorate([
    (0, type_graphql_1.Query)(() => User_1.User, { nullable: true }),
    __param(0, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "me", null);
__decorate([
    (0, type_graphql_1.Query)(() => [User_1.User]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "users", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [User_1.User, Object]),
    __metadata("design:returntype", void 0)
], UserResolver.prototype, "email", null);
UserResolver = __decorate([
    (0, type_graphql_1.Resolver)(User_1.User)
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map