/*
  Warnings:

  - Added the required column `scope` to the `sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SessionScope" AS ENUM ('STOREFRONT', 'ADMIN');

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "scope" "SessionScope" NOT NULL;
