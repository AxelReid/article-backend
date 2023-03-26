"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv-safe/config");
const orm_config_1 = require("./orm.config");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const redis_1 = require("./redis");
const cors_1 = __importDefault(require("cors"));
const createUserLoader_1 = require("./loader/createUserLoader");
const createUpdootLoader_1 = require("./loader/createUpdootLoader");
const main = async () => {
    await orm_config_1.AppDataSource.initialize().catch((err) => console.log('TypeOrm init failed: ', err));
    const app = (0, express_1.default)();
    const { redis, session } = (0, redis_1.redisSession)();
    app.set('trust proxy', 1);
    app.use(session);
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        context: ({ req, res }) => ({
            req,
            res,
            redis,
            loaders: {
                userLoader: createUserLoader_1.createUserLoader,
                updootLoader: createUpdootLoader_1.createUpdootLoader,
            },
        }),
        cache: 'bounded',
    });
    app.use((0, cors_1.default)({
        origin: ['http://localhost:3000', 'https://studio.apollographql.com'],
        credentials: true,
    }));
    await apolloServer.start();
    apolloServer.applyMiddleware({ app, cors: false });
    const port = parseInt(process.env.PORT);
    app.listen(port, () => console.log('Server started on localhost:' + port));
};
main().catch((err) => console.error(err));
//# sourceMappingURL=index.js.map