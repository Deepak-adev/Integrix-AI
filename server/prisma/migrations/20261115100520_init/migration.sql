-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'REJECTED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganisationMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganisationMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicySource" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "storagePath" TEXT,
    "mimeType" TEXT,
    "extractedText" TEXT,
    "pages" JSONB,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "composition" TEXT NOT NULL,
    "fit" TEXT,
    "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sellingPriceInr" DECIMAL(65,30) NOT NULL,
    "mrpInr" DECIMAL(65,30),
    "approvedClaims" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "claimsNotApproved" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "careInstructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "campaignPriceInr" DECIMAL(65,30) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "eligibleChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conditionsText" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "ruleFamily" TEXT,
    "ruleCategory" TEXT,
    "componentId" TEXT,
    "policyComponentId" TEXT,
    "validationComponentId" TEXT,
    "exceptionComponentId" TEXT,
    "errorComponentId" TEXT,
    "correctionComponentId" TEXT,
    "policyText" TEXT,
    "validationLogic" TEXT,
    "exceptionText" TEXT,
    "errorMessage" TEXT,
    "correctionGuidance" TEXT,
    "sourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "referenceComponentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "engine" TEXT NOT NULL DEFAULT 'DETERMINISTIC',
    "executionMode" TEXT NOT NULL DEFAULT 'ENFORCE',
    "requiredInputs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "passCriteria" TEXT,
    "failCriteria" TEXT,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "confidenceThreshold" DECIMAL(65,30),
    "evaluatorKey" TEXT,
    "owner" TEXT,
    "testCaseId" TEXT,
    "reasoning" TEXT,
    "badExample" TEXT,
    "goodExample" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleParameter" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleVersion" TEXT,
    "parameterName" TEXT NOT NULL,
    "parameterValue" TEXT NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'STRING',
    "unit" TEXT,
    "minValue" DECIMAL(65,30),
    "maxValue" DECIMAL(65,30),
    "description" TEXT,
    "sourceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleParameter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleException" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "exceptionId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleVersion" TEXT,
    "exceptionName" TEXT NOT NULL,
    "conditionText" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptanceScenario" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "testPackId" TEXT NOT NULL,
    "expectedAuditDocId" TEXT,
    "title" TEXT NOT NULL,
    "sku" TEXT,
    "publicationChannel" TEXT,
    "publicationDate" TIMESTAMP(3),
    "creativeFilename" TEXT,
    "creativeText" TEXT,
    "creativeFilePath" TEXT,
    "expectedOutcome" TEXT NOT NULL,
    "primaryRuleId" TEXT,
    "expectedSeverity" TEXT,
    "expectedEvidence" TEXT,
    "expectedCorrection" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcceptanceScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSubmission" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "filename" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "storagePath" TEXT,
    "publicationChannel" TEXT,
    "publicationDate" TIMESTAMP(3),
    "sku" TEXT,
    "advertisedPriceInr" DECIMAL(65,30),
    "advertisedComposition" TEXT,
    "performanceClaims" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliveryStatements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extractedText" TEXT,
    "extractedData" JSONB,
    "aiAnalysis" JSONB,
    "analysisEngine" TEXT,
    "discrepancyNote" TEXT,
    "rulebookVersion" TEXT,
    "rulebookReleaseId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "overallStatus" TEXT NOT NULL DEFAULT 'PASS',
    "totalFindings" INTEGER NOT NULL DEFAULT 0,
    "passedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "needsVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "adSubmissionId" TEXT NOT NULL,
    "ruleId" TEXT,
    "ruleVersion" TEXT,
    "policyName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "observedValue" TEXT,
    "expectedValue" TEXT,
    "explanation" TEXT,
    "sourceFilename" TEXT,
    "sourceLocator" TEXT,
    "sourceId" TEXT,
    "suggestedCorrection" TEXT,
    "evidenceExcerpt" TEXT,
    "metadata" JSONB,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RulebookRelease" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RulebookRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RulebookReleaseRule" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "RulebookReleaseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RulebookReleaseSource" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "RulebookReleaseSource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_slug_key" ON "Organisation"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "OrganisationMembership_organisationId_idx" ON "OrganisationMembership"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganisationMembership_userId_organisationId_key" ON "OrganisationMembership"("userId", "organisationId");

-- CreateIndex
CREATE INDEX "PolicySource_organisationId_idx" ON "PolicySource"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "PolicySource_organisationId_sourceId_key" ON "PolicySource"("organisationId", "sourceId");

-- CreateIndex
CREATE INDEX "Product_organisationId_idx" ON "Product"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_organisationId_sku_key" ON "Product"("organisationId", "sku");

-- CreateIndex
CREATE INDEX "Campaign_organisationId_idx" ON "Campaign"("organisationId");

-- CreateIndex
CREATE INDEX "Campaign_organisationId_sku_idx" ON "Campaign"("organisationId", "sku");

-- CreateIndex
CREATE INDEX "Campaign_organisationId_approvalStatus_idx" ON "Campaign"("organisationId", "approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_organisationId_campaignId_key" ON "Campaign"("organisationId", "campaignId");

-- CreateIndex
CREATE INDEX "PolicyRule_organisationId_idx" ON "PolicyRule"("organisationId");

-- CreateIndex
CREATE INDEX "PolicyRule_organisationId_status_idx" ON "PolicyRule"("organisationId", "status");

-- CreateIndex
CREATE INDEX "PolicyRule_organisationId_approvalStatus_idx" ON "PolicyRule"("organisationId", "approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyRule_organisationId_ruleId_ruleVersion_key" ON "PolicyRule"("organisationId", "ruleId", "ruleVersion");

-- CreateIndex
CREATE INDEX "RuleParameter_organisationId_idx" ON "RuleParameter"("organisationId");

-- CreateIndex
CREATE INDEX "RuleParameter_organisationId_ruleId_ruleVersion_idx" ON "RuleParameter"("organisationId", "ruleId", "ruleVersion");

-- CreateIndex
CREATE UNIQUE INDEX "RuleParameter_organisationId_parameterId_key" ON "RuleParameter"("organisationId", "parameterId");

-- CreateIndex
CREATE INDEX "RuleException_organisationId_idx" ON "RuleException"("organisationId");

-- CreateIndex
CREATE INDEX "RuleException_organisationId_ruleId_ruleVersion_idx" ON "RuleException"("organisationId", "ruleId", "ruleVersion");

-- CreateIndex
CREATE UNIQUE INDEX "RuleException_organisationId_exceptionId_key" ON "RuleException"("organisationId", "exceptionId");

-- CreateIndex
CREATE INDEX "AcceptanceScenario_organisationId_idx" ON "AcceptanceScenario"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "AcceptanceScenario_organisationId_testPackId_key" ON "AcceptanceScenario"("organisationId", "testPackId");

-- CreateIndex
CREATE INDEX "AdSubmission_organisationId_idx" ON "AdSubmission"("organisationId");

-- CreateIndex
CREATE INDEX "AdSubmission_organisationId_createdAt_idx" ON "AdSubmission"("organisationId", "createdAt");

-- CreateIndex
CREATE INDEX "AdSubmission_organisationId_overallStatus_idx" ON "AdSubmission"("organisationId", "overallStatus");

-- CreateIndex
CREATE INDEX "AdSubmission_organisationId_rulebookReleaseId_idx" ON "AdSubmission"("organisationId", "rulebookReleaseId");

-- CreateIndex
CREATE UNIQUE INDEX "AdSubmission_organisationId_submissionId_key" ON "AdSubmission"("organisationId", "submissionId");

-- CreateIndex
CREATE INDEX "Finding_organisationId_adSubmissionId_idx" ON "Finding"("organisationId", "adSubmissionId");

-- CreateIndex
CREATE INDEX "Finding_organisationId_ruleId_idx" ON "Finding"("organisationId", "ruleId");

-- CreateIndex
CREATE INDEX "Finding_organisationId_ruleId_ruleVersion_idx" ON "Finding"("organisationId", "ruleId", "ruleVersion");

-- CreateIndex
CREATE INDEX "RulebookRelease_organisationId_status_idx" ON "RulebookRelease"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RulebookRelease_organisationId_releaseId_key" ON "RulebookRelease"("organisationId", "releaseId");

-- CreateIndex
CREATE INDEX "RulebookReleaseRule_organisationId_releaseId_idx" ON "RulebookReleaseRule"("organisationId", "releaseId");

-- CreateIndex
CREATE INDEX "RulebookReleaseRule_organisationId_ruleId_ruleVersion_idx" ON "RulebookReleaseRule"("organisationId", "ruleId", "ruleVersion");

-- CreateIndex
CREATE UNIQUE INDEX "RulebookReleaseRule_organisationId_releaseId_ruleId_ruleVer_key" ON "RulebookReleaseRule"("organisationId", "releaseId", "ruleId", "ruleVersion");

-- CreateIndex
CREATE INDEX "RulebookReleaseSource_organisationId_releaseId_idx" ON "RulebookReleaseSource"("organisationId", "releaseId");

-- CreateIndex
CREATE INDEX "RulebookReleaseSource_organisationId_sourceId_idx" ON "RulebookReleaseSource"("organisationId", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "RulebookReleaseSource_organisationId_releaseId_sourceId_key" ON "RulebookReleaseSource"("organisationId", "releaseId", "sourceId");

-- AddForeignKey
ALTER TABLE "OrganisationMembership" ADD CONSTRAINT "OrganisationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganisationMembership" ADD CONSTRAINT "OrganisationMembership_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicySource" ADD CONSTRAINT "PolicySource_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organisationId_sku_fkey" FOREIGN KEY ("organisationId", "sku") REFERENCES "Product"("organisationId", "sku") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyRule" ADD CONSTRAINT "PolicyRule_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleParameter" ADD CONSTRAINT "RuleParameter_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleException" ADD CONSTRAINT "RuleException_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptanceScenario" ADD CONSTRAINT "AcceptanceScenario_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSubmission" ADD CONSTRAINT "AdSubmission_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdSubmission" ADD CONSTRAINT "AdSubmission_rulebookReleaseId_fkey" FOREIGN KEY ("rulebookReleaseId") REFERENCES "RulebookRelease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_adSubmissionId_fkey" FOREIGN KEY ("adSubmissionId") REFERENCES "AdSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RulebookRelease" ADD CONSTRAINT "RulebookRelease_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RulebookReleaseRule" ADD CONSTRAINT "RulebookReleaseRule_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RulebookReleaseRule" ADD CONSTRAINT "RulebookReleaseRule_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "RulebookRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RulebookReleaseSource" ADD CONSTRAINT "RulebookReleaseSource_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RulebookReleaseSource" ADD CONSTRAINT "RulebookReleaseSource_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "RulebookRelease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
