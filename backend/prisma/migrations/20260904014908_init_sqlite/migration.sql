-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "real_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role_id" INTEGER NOT NULL,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role_name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "wechat_id" TEXT,
    "qq" TEXT,
    "address" TEXT,
    "gender" TEXT,
    "id_number" TEXT,
    "birth_date" DATETIME,
    "credit_code" TEXT,
    "legal_rep" TEXT,
    "industry" TEXT,
    "scale" TEXT,
    "website" TEXT,
    "contact_name" TEXT,
    "contact_title" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "contact_wechat" TEXT,
    "service_plan" TEXT,
    "monthly_fee" DECIMAL,
    "service_start" DATETIME,
    "service_end" DATETIME,
    "tags" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "total_matters" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL NOT NULL DEFAULT 0,
    "last_contact_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "matters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matter_no" TEXT NOT NULL,
    "matter_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "client_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "fee_type" TEXT NOT NULL,
    "fee_amount" DECIMAL,
    "hourly_rate" DECIMAL,
    "total_amount" DECIMAL NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "start_date" DATETIME,
    "deadline" DATETIME,
    "completed_at" DATETIME,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "next_action" TEXT,
    "metadata" TEXT,
    "assignee_id" INTEGER,
    "created_by_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "matters_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matters_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "matters_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_id" INTEGER NOT NULL,
    "matter_id" INTEGER,
    "user_id" INTEGER,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "attachments" TEXT,
    "contact_name" TEXT,
    "contact_info" TEXT,
    "contact_wechat" TEXT,
    "external_id" TEXT,
    "thread_id" TEXT,
    "from_addr" TEXT,
    "to_addrs" TEXT,
    "cc_addrs" TEXT,
    "sent_at" DATETIME NOT NULL,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communications_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "communications_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "communications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matter_id" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "from_status" TEXT,
    "to_status" TEXT,
    "metadata" TEXT,
    "operator_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timeline_events_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matter_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "due_date" DATETIME,
    "completed_at" DATETIME,
    "reminder_at" DATETIME,
    "is_reminded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tasks_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matter_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "duration" INTEGER,
    "hourly_rate" DECIMAL NOT NULL,
    "amount" DECIMAL,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "is_billed" BOOLEAN NOT NULL DEFAULT false,
    "invoice_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_entries_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "time_entries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "time_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_no" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "matter_id" INTEGER,
    "created_by_id" INTEGER NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "tax_rate" DECIMAL NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL NOT NULL DEFAULT 0,
    "discount" DECIMAL NOT NULL DEFAULT 0,
    "total_amount" DECIMAL NOT NULL,
    "paid_amount" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issue_date" DATETIME,
    "due_date" DATETIME,
    "paid_at" DATETIME,
    "items" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoice_id" INTEGER NOT NULL,
    "amount" DECIMAL NOT NULL,
    "payment_date" DATETIME NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_hash" TEXT,
    "client_id" INTEGER,
    "matter_id" INTEGER,
    "uploader_id" INTEGER,
    "category" TEXT,
    "tags" TEXT,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "enterprise_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_id" INTEGER NOT NULL,
    "service_level" TEXT NOT NULL,
    "response_time" INTEGER NOT NULL,
    "monthly_quota" INTEGER NOT NULL,
    "used_quota" INTEGER NOT NULL DEFAULT 0,
    "oa_webhook_url" TEXT,
    "oa_api_key" TEXT,
    "oa_api_secret" TEXT,
    "dingtalk_token" TEXT,
    "wecom_corp_id" TEXT,
    "wecom_agent_id" TEXT,
    "wecom_secret" TEXT,
    "members" TEXT,
    "portal_title" TEXT,
    "portal_logo" TEXT,
    "portal_theme" TEXT,
    "custom_fields" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "enterprise_configs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resource_id" INTEGER,
    "method" TEXT,
    "path" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "details" TEXT,
    "status" TEXT NOT NULL,
    "error_msg" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_name_key" ON "roles"("role_name");

-- CreateIndex
CREATE INDEX "clients_client_type_idx" ON "clients"("client_type");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "clients"("phone");

-- CreateIndex
CREATE INDEX "clients_status_idx" ON "clients"("status");

-- CreateIndex
CREATE INDEX "clients_last_contact_at_idx" ON "clients"("last_contact_at");

-- CreateIndex
CREATE UNIQUE INDEX "matters_matter_no_key" ON "matters"("matter_no");

-- CreateIndex
CREATE INDEX "matters_client_id_idx" ON "matters"("client_id");

-- CreateIndex
CREATE INDEX "matters_matter_type_idx" ON "matters"("matter_type");

-- CreateIndex
CREATE INDEX "matters_status_idx" ON "matters"("status");

-- CreateIndex
CREATE INDEX "matters_assignee_id_idx" ON "matters"("assignee_id");

-- CreateIndex
CREATE INDEX "matters_deadline_idx" ON "matters"("deadline");

-- CreateIndex
CREATE INDEX "matters_created_at_idx" ON "matters"("created_at");

-- CreateIndex
CREATE INDEX "communications_client_id_idx" ON "communications"("client_id");

-- CreateIndex
CREATE INDEX "communications_matter_id_idx" ON "communications"("matter_id");

-- CreateIndex
CREATE INDEX "communications_channel_idx" ON "communications"("channel");

-- CreateIndex
CREATE INDEX "communications_sent_at_idx" ON "communications"("sent_at");

-- CreateIndex
CREATE INDEX "communications_external_id_idx" ON "communications"("external_id");

-- CreateIndex
CREATE INDEX "timeline_events_matter_id_idx" ON "timeline_events"("matter_id");

-- CreateIndex
CREATE INDEX "timeline_events_created_at_idx" ON "timeline_events"("created_at");

-- CreateIndex
CREATE INDEX "tasks_user_id_idx" ON "tasks"("user_id");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_due_date_idx" ON "tasks"("due_date");

-- CreateIndex
CREATE INDEX "time_entries_matter_id_idx" ON "time_entries"("matter_id");

-- CreateIndex
CREATE INDEX "time_entries_user_id_idx" ON "time_entries"("user_id");

-- CreateIndex
CREATE INDEX "time_entries_is_billed_idx" ON "time_entries"("is_billed");

-- CreateIndex
CREATE INDEX "time_entries_start_time_idx" ON "time_entries"("start_time");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_no_key" ON "invoices"("invoice_no");

-- CreateIndex
CREATE INDEX "invoices_client_id_idx" ON "invoices"("client_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_issue_date_idx" ON "invoices"("issue_date");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "documents_client_id_idx" ON "documents"("client_id");

-- CreateIndex
CREATE INDEX "documents_matter_id_idx" ON "documents"("matter_id");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "documents"("category");

-- CreateIndex
CREATE UNIQUE INDEX "enterprise_configs_client_id_key" ON "enterprise_configs"("client_id");

-- CreateIndex
CREATE INDEX "system_logs_user_id_idx" ON "system_logs"("user_id");

-- CreateIndex
CREATE INDEX "system_logs_action_idx" ON "system_logs"("action");

-- CreateIndex
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");
