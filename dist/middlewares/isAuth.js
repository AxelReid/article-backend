"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const isAuth = ({ context }, next) => {
    if (context.req.session.userId)
        return next();
    throw new Error('Unauthorized!');
};
exports.isAuth = isAuth;
//# sourceMappingURL=isAuth.js.map