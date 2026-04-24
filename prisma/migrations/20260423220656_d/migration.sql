-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerId" INTEGER NOT NULL,
    "userTagId" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    CONSTRAINT "Tag_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("id", "name", "ownerId") SELECT "id", "name", "ownerId" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_ownerId_name_key" ON "Tag"("ownerId", "name");
CREATE UNIQUE INDEX "Tag_ownerId_userTagId_key" ON "Tag"("ownerId", "userTagId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
