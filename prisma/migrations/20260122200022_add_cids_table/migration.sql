-- CreateTable
CREATE TABLE "cids" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cids_code_key" ON "cids"("code");

-- CreateIndex
CREATE INDEX "cids_code_idx" ON "cids"("code");

-- CreateIndex
CREATE INDEX "cids_category_idx" ON "cids"("category");
