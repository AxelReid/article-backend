"migration:revert": "npm run typeorm -- migration:revert"

"typeorm": "npx typeorm -d ./dist/orm.config.js",
"migration:create": "npm run typeorm -- migration:create ./migrations",
"migration:generate": "npm run typeorm -- migration:generate",
"migration:run": "npm run typeorm -- migration:run",
