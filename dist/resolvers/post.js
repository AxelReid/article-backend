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
exports.PostResolver = void 0;
const Post_1 = require("../entities/Post");
const type_graphql_1 = require("type-graphql");
const CreatePostInput_1 = require("../dto/CreatePostInput");
const isAuth_1 = require("../middlewares/isAuth");
const PaginatedPosts_1 = require("../dto/PaginatedPosts");
const UpDoot_1 = require("../entities/UpDoot");
const User_1 = require("../entities/User");
const VoteResponse_1 = require("../dto/VoteResponse");
const UpdatePostInput_1 = require("../dto/UpdatePostInput");
const typeorm_1 = require("typeorm");
const orm_config_1 = require("../orm.config");
let PostResolver = class PostResolver {
    async createPost(createPostInput, { req }) {
        return Post_1.Post.create(Object.assign(Object.assign({}, createPostInput), { creatorId: req.session.userId })).save();
    }
    async updatePost(id, updatePostInput, { req }) {
        const post = await this.post(id);
        if (post.creatorId !== req.session.userId)
            throw new Error("You can't update!");
        return await Post_1.Post.save(Object.assign(Object.assign({}, post), updatePostInput));
    }
    async deletePost(id, { req }) {
        const d = await Post_1.Post.delete({ id, creatorId: req.session.userId });
        return !!d.affected;
    }
    async vote(postId, value, { req }) {
        const { userId } = req.session;
        const realValue = value > 0 ? 1 : -1;
        const vote = await UpDoot_1.UpDoot.findOneBy({ userId, postId });
        const point = !vote
            ? realValue
            :
                vote.value === realValue
                    ? -realValue
                    :
                        realValue * 2;
        const response = {
            value: 0,
            updatedPoints: null,
        };
        await orm_config_1.AppDataSource.transaction(async (tm) => {
            if (vote) {
                if (vote.value === realValue) {
                    await tm.delete(UpDoot_1.UpDoot, { userId, postId });
                }
                else {
                    await tm.update(UpDoot_1.UpDoot, { userId, postId }, { value: realValue });
                    response.value = realValue;
                }
            }
            else {
                await tm.insert(UpDoot_1.UpDoot, { userId, postId, value: realValue });
                response.value = realValue;
            }
            const res = await tm
                .getRepository(Post_1.Post)
                .createQueryBuilder('post')
                .update(Post_1.Post)
                .where(`id = ${postId}`)
                .set({ points: () => `points + ${point}` })
                .returning(['points'])
                .execute();
            response.updatedPoints = res.raw[0].points;
        });
        return response;
    }
    textShort(root) {
        return root.text.slice(0, 50).trim() + (root.text.length > 50 ? ' ...' : '');
    }
    creator(root, { loaders }) {
        return loaders.userLoader.load(root.creatorId);
    }
    async updoots(root, { req, loaders }) {
        const userId = req.session.userId;
        if (!userId)
            return { value: 0 };
        const updoots = await loaders.updootLoader.load({ postId: root.id, userId });
        return {
            value: updoots.value,
        };
    }
    async posts(limit, cursor) {
        const realLimit = Math.min(50, limit);
        const realLimitPlusOne = realLimit + 1;
        const posts = await Post_1.Post.find({
            order: { createdAt: 'desc' },
            take: realLimitPlusOne,
            where: Object.assign({}, (cursor ? { createdAt: (0, typeorm_1.LessThan)(new Date(cursor)) } : {})),
        });
        return {
            posts: posts === null || posts === void 0 ? void 0 : posts.slice(0, realLimit),
            hasMore: posts.length === realLimitPlusOne,
        };
    }
    async post(id) {
        const post = await Post_1.Post.findOneBy({ id });
        if (post)
            return post;
        throw new Error('Post not found!');
    }
    async postEdit(id, { req }) {
        const creatorId = req.session.userId;
        const post = await Post_1.Post.findOne({
            where: {
                id,
                creatorId,
            },
            select: {
                id: true,
                title: true,
                text: true,
            },
        });
        if (post)
            return post;
        throw new Error("You don't have a that post");
    }
};
__decorate([
    (0, type_graphql_1.Mutation)(() => Post_1.Post),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('createPostInput')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePostInput_1.CreatePostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "createPost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Post_1.Post, { nullable: true }),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('id', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('updatePostInput')),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdatePostInput_1.UpdatePostInput, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updatePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => Boolean),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('id')),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "deletePost", null);
__decorate([
    (0, type_graphql_1.Mutation)(() => VoteResponse_1.VoteResponse),
    (0, type_graphql_1.UseMiddleware)(isAuth_1.isAuth),
    __param(0, (0, type_graphql_1.Arg)('postId', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('value', () => type_graphql_1.Int)),
    __param(2, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "vote", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => String),
    __param(0, (0, type_graphql_1.Root)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "textShort", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => User_1.User),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", void 0)
], PostResolver.prototype, "creator", null);
__decorate([
    (0, type_graphql_1.FieldResolver)(() => Number),
    __param(0, (0, type_graphql_1.Root)()),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Post_1.Post, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "updoots", null);
__decorate([
    (0, type_graphql_1.Query)(() => PaginatedPosts_1.PaginatedPosts),
    __param(0, (0, type_graphql_1.Arg)('limit', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Arg)('cursor', () => String, { nullable: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "posts", null);
__decorate([
    (0, type_graphql_1.Query)(() => Post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)('id', () => type_graphql_1.Int)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "post", null);
__decorate([
    (0, type_graphql_1.Query)(() => Post_1.Post, { nullable: true }),
    __param(0, (0, type_graphql_1.Arg)('id', () => type_graphql_1.Int)),
    __param(1, (0, type_graphql_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PostResolver.prototype, "postEdit", null);
PostResolver = __decorate([
    (0, type_graphql_1.Resolver)(Post_1.Post)
], PostResolver);
exports.PostResolver = PostResolver;
//# sourceMappingURL=post.js.map