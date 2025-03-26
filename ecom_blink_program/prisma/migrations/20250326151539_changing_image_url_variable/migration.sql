/*
  Warnings:

  - You are about to drop the column `productName` on the `Response` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Response" DROP COLUMN "productName",
ADD COLUMN     "title" TEXT;
