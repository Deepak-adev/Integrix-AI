-- CreateEnum
CREATE TYPE "PolicyIntelligenceCategory" AS ENUM ('CONFLICT', 'AMBIGUITY', 'MISSING_REQUIREMENT', 'DUPLICATION');

-- CreateEnum
CREATE TYPE "PolicyIntelligenceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PolicyFindingReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EDITED', 'DEFERRED');

-- CreateTable
CREATE TABLE "PolicyAnalysisRun" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "title" TEXT,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "summary" TEXT,
    "totalFindings" INTEGER NOT NULL DEFAULT 0,
    "conflictsCount" INTEGER NOT NULL DEFAULT 0,
    "ambiguitiesCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "duplicatesCount" INTEGER NOT NULL DEFAULT 0,
    "pendingReviewCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyAnalysisRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyFinding" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "category" "PolicyIntelligenceCategory" NOT NULL,
    "severity" "PolicyIntelligenceSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "PolicyFindingReviewStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "affectedPolicyOrDoc" TEXT NOT NULL,
    "sourceDocumentName" TEXT,
    "sourceLocator" TEXT,
    "evidenceExcerpts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "existingWording" TEXT,
    "recommendedWording" TEXT,
    "rationale" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "isNeedsVerification" BOOLEAN NOT NULL DEFAULT false,
    "proposedDraftRuleId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyFindingReview" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "action" "PolicyFindingReviewStatus" NOT NULL,
    "reviewerName" TEXT NOT NULL DEFAULT 'Lead Compliance Administrator',
    "reviewerRole" TEXT NOT NULL DEFAULT 'ADMIN',
    "adminComments" TEXT,
    "rejectionReason" TEXT,
    "modifiedWording" TEXT,
    "stagedRuleId" TEXT,
    "stagedDraftId" TEXT,
    "metadata" JSONB,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyFindingReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolicyAnalysisRun_organisationId_runId_key" ON "PolicyAnalysisRun"("organisationId", "runId");
CREATE INDEX "PolicyAnalysisRun_organisationId_idx" ON "PolicyAnalysisRun"("organisationId");
CREATE INDEX "PolicyAnalysisRun_organisationId_createdAt_idx" ON "PolicyAnalysisRun"("organisationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyFinding_organisationId_findingId_key" ON "PolicyFinding"("organisationId", "findingId");
CREATE INDEX "PolicyFinding_organisationId_idx" ON "PolicyFinding"("organisationId");
CREATE INDEX "PolicyFinding_organisationId_runId_idx" ON "PolicyFinding"("organisationId", "runId");
CREATE INDEX "PolicyFinding_organisationId_category_idx" ON "PolicyFinding"("organisationId", "category");
CREATE INDEX "PolicyFinding_organisationId_severity_idx" ON "PolicyFinding"("organisationId", "severity");
CREATE INDEX "PolicyFinding_organisationId_status_idx" ON "PolicyFinding"("organisationId", "status");

-- CreateIndex
CREATE INDEX "PolicyFindingReview_organisationId_idx" ON "PolicyFindingReview"("organisationId");
CREATE INDEX "PolicyFindingReview_organisationId_findingId_idx" ON "PolicyFindingReview"("organisationId", "findingId");
CREATE INDEX "PolicyFindingReview_organisationId_action_idx" ON "PolicyFindingReview"("organisationId", "action");

-- AddForeignKey
ALTER TABLE "PolicyAnalysisRun" ADD CONSTRAINT "PolicyAnalysisRun_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyFinding" ADD CONSTRAINT "PolicyFinding_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyFinding" ADD CONSTRAINT "PolicyFinding_organisationId_runId_fkey" FOREIGN KEY ("organisationId", "runId") REFERENCES "PolicyAnalysisRun"("organisationId", "runId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyFindingReview" ADD CONSTRAINT "PolicyFindingReview_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyFindingReview" ADD CONSTRAINT "PolicyFindingReview_organisationId_findingId_fkey" FOREIGN KEY ("organisationId", "findingId") REFERENCES "PolicyFinding"("organisationId", "findingId") ON DELETE CASCADE ON UPDATE CASCADE;
