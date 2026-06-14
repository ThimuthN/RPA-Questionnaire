-- CreateTable
CREATE TABLE "IntegrationProviderApp" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "clientId" TEXT,
    "clientSecretEncrypted" TEXT,
    "tenantId" TEXT,
    "scopesJson" JSONB,
    "configJson" JSONB,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastHealthStatus" TEXT NOT NULL DEFAULT 'not_configured',
    "lastHealthError" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationProviderApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentIntegrationConnection" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_connected',
    "connectedAccountId" TEXT,
    "connectedAccountLabel" TEXT,
    "connectedTenantId" TEXT,
    "scopesJson" JSONB,
    "accessTokenEncrypted" TEXT,
    "refreshTokenEncrypted" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSuccessAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentIntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentIntegrationResource" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "externalResourceId" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "emailAddress" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentIntegrationResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookSubscription" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "connectionId" TEXT,
    "resourceTarget" TEXT NOT NULL,
    "externalSubscriptionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "lastRenewedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationWebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationSyncCursor" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "cursorValue" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEmailThread" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalThreadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateEmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateEmailMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipientsJson" JSONB NOT NULL,
    "bodyPreview" TEXT,
    "sanitizedHtml" TEXT,
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateEmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewEventSync" (
    "id" TEXT NOT NULL,
    "interviewPanelId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalCalendarEventId" TEXT NOT NULL,
    "externalMeetingId" TEXT,
    "joinUrl" TEXT,
    "organizerAccountId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewEventSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationProviderApp_provider_key" ON "IntegrationProviderApp"("provider");

-- CreateIndex
CREATE INDEX "DepartmentIntegrationConnection_departmentId_status_idx" ON "DepartmentIntegrationConnection"("departmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentIntegrationConnection_departmentId_provider_key" ON "DepartmentIntegrationConnection"("departmentId", "provider");

-- CreateIndex
CREATE INDEX "DepartmentIntegrationResource_connectionId_resourceType_isD_idx" ON "DepartmentIntegrationResource"("connectionId", "resourceType", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentIntegrationResource_connectionId_resourceType_ext_key" ON "DepartmentIntegrationResource"("connectionId", "resourceType", "externalResourceId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookSubscription_connectionId_status_idx" ON "IntegrationWebhookSubscription"("connectionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationWebhookSubscription_provider_externalSubscriptio_key" ON "IntegrationWebhookSubscription"("provider", "externalSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationSyncCursor_connectionId_domain_key" ON "IntegrationSyncCursor"("connectionId", "domain");

-- CreateIndex
CREATE INDEX "CandidateEmailThread_candidateId_lastMessageAt_idx" ON "CandidateEmailThread"("candidateId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "CandidateEmailThread_departmentId_lastMessageAt_idx" ON "CandidateEmailThread"("departmentId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateEmailThread_provider_externalThreadId_key" ON "CandidateEmailThread"("provider", "externalThreadId");

-- CreateIndex
CREATE INDEX "CandidateEmailMessage_threadId_createdAt_idx" ON "CandidateEmailMessage"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "CandidateEmailMessage_candidateId_createdAt_idx" ON "CandidateEmailMessage"("candidateId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateEmailMessage_provider_providerMessageId_key" ON "CandidateEmailMessage"("provider", "providerMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewEventSync_interviewPanelId_key" ON "InterviewEventSync"("interviewPanelId");

-- CreateIndex
CREATE INDEX "InterviewEventSync_connectionId_provider_idx" ON "InterviewEventSync"("connectionId", "provider");

-- AddForeignKey
ALTER TABLE "DepartmentIntegrationConnection" ADD CONSTRAINT "DepartmentIntegrationConnection_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentIntegrationResource" ADD CONSTRAINT "DepartmentIntegrationResource_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DepartmentIntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookSubscription" ADD CONSTRAINT "IntegrationWebhookSubscription_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DepartmentIntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncCursor" ADD CONSTRAINT "IntegrationSyncCursor_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DepartmentIntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEmailThread" ADD CONSTRAINT "CandidateEmailThread_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEmailThread" ADD CONSTRAINT "CandidateEmailThread_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEmailMessage" ADD CONSTRAINT "CandidateEmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "CandidateEmailThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateEmailMessage" ADD CONSTRAINT "CandidateEmailMessage_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEventSync" ADD CONSTRAINT "InterviewEventSync_interviewPanelId_fkey" FOREIGN KEY ("interviewPanelId") REFERENCES "InterviewPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewEventSync" ADD CONSTRAINT "InterviewEventSync_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "DepartmentIntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

