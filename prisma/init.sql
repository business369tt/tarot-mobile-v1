-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TarotSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "saveToHistory" BOOLEAN NOT NULL DEFAULT true,
    "spreadCardsJson" TEXT NOT NULL,
    "selectedCardsJson" TEXT NOT NULL DEFAULT '[]',
    "revealed" INTEGER NOT NULL DEFAULT 0,
    "ritualStartedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TarotSession_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "cardsSnapshot" TEXT NOT NULL,
    "fullReading" TEXT,
    "source" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "costPoints" INTEGER NOT NULL DEFAULT 0,
    "chargeRequestKey" TEXT,
    "chargeTransactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReadingRecord_chargeTransactionId_fkey" FOREIGN KEY ("chargeTransactionId") REFERENCES "PointTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ReadingRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TarotSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ReadingRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "chargeTransactionId" TEXT NOT NULL,
    "claimedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyCheckIn_chargeTransactionId_fkey" FOREIGN KEY ("chargeTransactionId") REFERENCES "PointTransaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DailyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InviteProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InviteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InviteReferral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inviteProfileId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT,
    "inviteeName" TEXT,
    "status" TEXT NOT NULL,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "rewardTransactionId" TEXT,
    "claimedAt" DATETIME,
    "rewardedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InviteReferral_inviteProfileId_fkey" FOREIGN KEY ("inviteProfileId") REFERENCES "InviteProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InviteReferral_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InviteReferral_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InviteReferral_rewardTransactionId_fkey" FOREIGN KEY ("rewardTransactionId") REFERENCES "PointTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowupRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "readingRecordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "chargeTransactionId" TEXT,
    "costPoints" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FollowupRecord_chargeTransactionId_fkey" FOREIGN KEY ("chargeTransactionId") REFERENCES "PointTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FollowupRecord_readingRecordId_fkey" FOREIGN KEY ("readingRecordId") REFERENCES "ReadingRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FollowupRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TopUpOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageLabel" TEXT NOT NULL,
    "packageCaption" TEXT,
    "points" INTEGER NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestKey" TEXT NOT NULL,
    "intent" TEXT,
    "returnTo" TEXT NOT NULL,
    "checkoutSessionId" TEXT,
    "checkoutUrl" TEXT,
    "providerPaymentId" TEXT,
    "pointTransactionId" TEXT,
    "errorMessage" TEXT,
    "paidAt" DATETIME,
    "canceledAt" DATETIME,
    "failedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TopUpOrder_pointTransactionId_fkey" FOREIGN KEY ("pointTransactionId") REFERENCES "PointTransaction" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TopUpOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "TarotSession_ownerId_updatedAt_idx" ON "TarotSession"("ownerId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingRecord_sessionId_key" ON "ReadingRecord"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingRecord_chargeRequestKey_key" ON "ReadingRecord"("chargeRequestKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReadingRecord_chargeTransactionId_key" ON "ReadingRecord"("chargeTransactionId");

-- CreateIndex
CREATE INDEX "ReadingRecord_userId_updatedAt_idx" ON "ReadingRecord"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ReadingRecord_status_updatedAt_idx" ON "ReadingRecord"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PointTransaction_requestKey_key" ON "PointTransaction"("requestKey");

-- CreateIndex
CREATE INDEX "PointTransaction_userId_createdAt_idx" ON "PointTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PointTransaction_source_createdAt_idx" ON "PointTransaction"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_chargeTransactionId_key" ON "DailyCheckIn"("chargeTransactionId");

-- CreateIndex
CREATE INDEX "DailyCheckIn_userId_claimedAt_idx" ON "DailyCheckIn"("userId", "claimedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_userId_dayKey_key" ON "DailyCheckIn"("userId", "dayKey");

-- CreateIndex
CREATE UNIQUE INDEX "InviteProfile_userId_key" ON "InviteProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteProfile_code_key" ON "InviteProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InviteReferral_inviteeId_key" ON "InviteReferral"("inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteReferral_rewardTransactionId_key" ON "InviteReferral"("rewardTransactionId");

-- CreateIndex
CREATE INDEX "InviteReferral_inviterId_updatedAt_idx" ON "InviteReferral"("inviterId", "updatedAt");

-- CreateIndex
CREATE INDEX "InviteReferral_inviteProfileId_createdAt_idx" ON "InviteReferral"("inviteProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "InviteReferral_status_updatedAt_idx" ON "InviteReferral"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "FollowupRecord_requestKey_key" ON "FollowupRecord"("requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "FollowupRecord_chargeTransactionId_key" ON "FollowupRecord"("chargeTransactionId");

-- CreateIndex
CREATE INDEX "FollowupRecord_readingRecordId_createdAt_idx" ON "FollowupRecord"("readingRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "FollowupRecord_userId_updatedAt_idx" ON "FollowupRecord"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "FollowupRecord_status_updatedAt_idx" ON "FollowupRecord"("status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TopUpOrder_requestKey_key" ON "TopUpOrder"("requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "TopUpOrder_checkoutSessionId_key" ON "TopUpOrder"("checkoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TopUpOrder_providerPaymentId_key" ON "TopUpOrder"("providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "TopUpOrder_pointTransactionId_key" ON "TopUpOrder"("pointTransactionId");

-- CreateIndex
CREATE INDEX "TopUpOrder_userId_createdAt_idx" ON "TopUpOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TopUpOrder_status_updatedAt_idx" ON "TopUpOrder"("status", "updatedAt");
