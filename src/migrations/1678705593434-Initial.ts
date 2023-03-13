import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1678705593434 implements MigrationInterface {
    name = 'Initial1678705593434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "email" varchar NOT NULL, "username" varchar NOT NULL, "password" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"))`);
        await queryRunner.query(`CREATE TABLE "up_doot" ("value" integer NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, PRIMARY KEY ("userId", "postId"))`);
        await queryRunner.query(`CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "text" varchar NOT NULL, "creatorId" integer NOT NULL, "points" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_up_doot" ("value" integer NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "FK_ca1890caeb8cc9fdbf129506030" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_1c5746647e89fd040bcbb8e44d4" FOREIGN KEY ("postId") REFERENCES "post" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("userId", "postId"))`);
        await queryRunner.query(`INSERT INTO "temporary_up_doot"("value", "userId", "postId") SELECT "value", "userId", "postId" FROM "up_doot"`);
        await queryRunner.query(`DROP TABLE "up_doot"`);
        await queryRunner.query(`ALTER TABLE "temporary_up_doot" RENAME TO "up_doot"`);
        await queryRunner.query(`CREATE TABLE "temporary_post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "text" varchar NOT NULL, "creatorId" integer NOT NULL, "points" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b" FOREIGN KEY ("creatorId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_post"("id", "title", "text", "creatorId", "points", "createdAt", "updatedAt") SELECT "id", "title", "text", "creatorId", "points", "createdAt", "updatedAt" FROM "post"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`ALTER TABLE "temporary_post" RENAME TO "post"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" RENAME TO "temporary_post"`);
        await queryRunner.query(`CREATE TABLE "post" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar NOT NULL, "text" varchar NOT NULL, "creatorId" integer NOT NULL, "points" integer NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "post"("id", "title", "text", "creatorId", "points", "createdAt", "updatedAt") SELECT "id", "title", "text", "creatorId", "points", "createdAt", "updatedAt" FROM "temporary_post"`);
        await queryRunner.query(`DROP TABLE "temporary_post"`);
        await queryRunner.query(`ALTER TABLE "up_doot" RENAME TO "temporary_up_doot"`);
        await queryRunner.query(`CREATE TABLE "up_doot" ("value" integer NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, PRIMARY KEY ("userId", "postId"))`);
        await queryRunner.query(`INSERT INTO "up_doot"("value", "userId", "postId") SELECT "value", "userId", "postId" FROM "temporary_up_doot"`);
        await queryRunner.query(`DROP TABLE "temporary_up_doot"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "up_doot"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
