/*
  Warnings:

  - You are about to drop the column `imageURL` on the `Response` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Response" DROP COLUMN "imageURL",
ADD COLUMN     "image_url" TEXT;
