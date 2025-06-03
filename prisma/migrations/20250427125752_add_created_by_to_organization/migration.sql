/*
  Warnings:

  - Added the required column `created_by` to the `Organization` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Organization" ADD COLUMN     "created_by" TEXT NOT NULL;
