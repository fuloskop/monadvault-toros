/*
  Warnings:

  - You are about to drop the `PlinkoGame` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlinkoGame" DROP CONSTRAINT "PlinkoGame_userId_fkey";

-- DropTable
DROP TABLE "PlinkoGame";
