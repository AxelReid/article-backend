"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv-safe/config");
const path_1 = require("path");
const typeorm_1 = require("typeorm");
const ormConfig = {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    entities: [(0, path_1.join)(__dirname, './entities/**/*.js')],
    migrations: [(0, path_1.join)(__dirname, './migrations/*')],
};
exports.default = ormConfig;
exports.AppDataSource = new typeorm_1.DataSource(ormConfig);
//# sourceMappingURL=orm.config.js.map