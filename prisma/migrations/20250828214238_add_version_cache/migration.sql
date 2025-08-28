-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER'
);

-- CreateTable
CREATE TABLE "VerssionCache" (
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "jarUrl" TEXT NOT NULL,
    "releaseTime" DATETIME,

    PRIMARY KEY ("name", "type")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "VerssionCache_type_idx" ON "VerssionCache"("type");
