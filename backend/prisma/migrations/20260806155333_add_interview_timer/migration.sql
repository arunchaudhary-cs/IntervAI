-- AlterTable
ALTER TABLE "public"."Interview" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."InterviewReport" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "strengths" TEXT NOT NULL,
    "weaknesses" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "improvements" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InterviewReport_interviewId_key" ON "public"."InterviewReport"("interviewId");

-- AddForeignKey
ALTER TABLE "public"."InterviewReport" ADD CONSTRAINT "InterviewReport_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "public"."Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
