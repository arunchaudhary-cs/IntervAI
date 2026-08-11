-- DropForeignKey
ALTER TABLE "public"."Interview" DROP CONSTRAINT "Interview_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Interview" ALTER COLUMN "status" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
