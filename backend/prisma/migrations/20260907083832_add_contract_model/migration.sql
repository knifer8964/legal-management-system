-- CreateTable
CREATE TABLE "contracts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contract_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contract_type" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "matter_id" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "amount" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "start_date" DATETIME,
    "end_date" DATETIME,
    "sign_date" DATETIME,
    "review_date" DATETIME,
    "content" TEXT,
    "summary" TEXT,
    "attachments" TEXT,
    "counterparty" TEXT,
    "counterparty_contact" TEXT,
    "counterparty_phone" TEXT,
    "reviewed_by" INTEGER,
    "approved_by" INTEGER,
    "review_notes" TEXT,
    "created_by_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contracts_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "contracts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contract_no_key" ON "contracts"("contract_no");

-- CreateIndex
CREATE INDEX "contracts_client_id_idx" ON "contracts"("client_id");

-- CreateIndex
CREATE INDEX "contracts_matter_id_idx" ON "contracts"("matter_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_contract_type_idx" ON "contracts"("contract_type");

-- CreateIndex
CREATE INDEX "contracts_created_at_idx" ON "contracts"("created_at");
