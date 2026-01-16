-- CreateTable
CREATE TABLE "payment_treatment_plans" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "treatmentPlanId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_treatment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_treatment_plans_paymentId_idx" ON "payment_treatment_plans"("paymentId");

-- CreateIndex
CREATE INDEX "payment_treatment_plans_treatmentPlanId_idx" ON "payment_treatment_plans"("treatmentPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_treatment_plans_paymentId_treatmentPlanId_key" ON "payment_treatment_plans"("paymentId", "treatmentPlanId");

-- AddForeignKey
ALTER TABLE "payment_treatment_plans" ADD CONSTRAINT "payment_treatment_plans_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_treatment_plans" ADD CONSTRAINT "payment_treatment_plans_treatmentPlanId_fkey" FOREIGN KEY ("treatmentPlanId") REFERENCES "treatment_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
