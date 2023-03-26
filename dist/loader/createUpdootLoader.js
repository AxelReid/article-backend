"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdootLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const UpDoot_1 = require("../entities/UpDoot");
exports.createUpdootLoader = new dataloader_1.default(async (keys) => {
    const currentUserVotes = await UpDoot_1.UpDoot.findBy(keys);
    const voteIdsToVote = {};
    currentUserVotes.forEach((u) => {
        voteIdsToVote[`${u.userId}|${u.postId}`] = u;
    });
    return keys.map((k) => {
        const vote = voteIdsToVote[`${k.userId}|${k.postId}`];
        return {
            postId: (vote === null || vote === void 0 ? void 0 : vote.postId) || k.postId,
            value: (vote === null || vote === void 0 ? void 0 : vote.value) || 0,
        };
    });
});
//# sourceMappingURL=createUpdootLoader.js.map