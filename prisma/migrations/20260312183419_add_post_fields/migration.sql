/*
  Warnings:

  - Added the required column `sourceTitle` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sourceUrl` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "aiScore" DOUBLE PRECISION,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "postedAt" TIMESTAMP(3),
ADD COLUMN     "rawContent" TEXT,
ADD COLUMN     "screenshotUrl" TEXT,
ADD COLUMN     "sourceTitle" TEXT NOT NULL,
ADD COLUMN     "sourceUrl" TEXT NOT NULL,
ALTER COLUMN "scheduledAt" DROP NOT NULL,
ALTER COLUMN "scheduledAt" DROP DEFAULT;
