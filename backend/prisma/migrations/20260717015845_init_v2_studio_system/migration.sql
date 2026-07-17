-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `real_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(20) NULL,
    `role_id` INTEGER NOT NULL,
    `department` VARCHAR(100) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'LOCKED') NOT NULL DEFAULT 'ACTIVE',
    `last_login_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_username_idx`(`username`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_id_idx`(`role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `permissions` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `roles_role_name_key`(`role_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_type` ENUM('PERSONAL', 'ENTERPRISE') NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `short_name` VARCHAR(50) NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `wechat_id` VARCHAR(50) NULL,
    `qq` VARCHAR(20) NULL,
    `address` VARCHAR(255) NULL,
    `gender` VARCHAR(10) NULL,
    `id_number` VARCHAR(50) NULL,
    `birth_date` DATE NULL,
    `credit_code` VARCHAR(50) NULL,
    `legal_rep` VARCHAR(50) NULL,
    `industry` VARCHAR(50) NULL,
    `scale` VARCHAR(20) NULL,
    `website` VARCHAR(255) NULL,
    `contact_name` VARCHAR(50) NULL,
    `contact_title` VARCHAR(50) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `contact_email` VARCHAR(100) NULL,
    `contact_wechat` VARCHAR(50) NULL,
    `service_plan` VARCHAR(50) NULL,
    `monthly_fee` DECIMAL(10, 2) NULL,
    `service_start` DATE NULL,
    `service_end` DATE NULL,
    `tags` JSON NULL,
    `notes` TEXT NULL,
    `source` VARCHAR(50) NULL,
    `total_matters` INTEGER NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `last_contact_at` DATETIME(0) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'POTENTIAL', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `clients_client_type_idx`(`client_type`),
    INDEX `clients_name_idx`(`name`),
    INDEX `clients_phone_idx`(`phone`),
    INDEX `clients_status_idx`(`status`),
    INDEX `clients_last_contact_at_idx`(`last_contact_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matters` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matter_no` VARCHAR(50) NOT NULL,
    `matter_type` ENUM('CONSULTATION', 'CONTRACT_REVIEW', 'CONTRACT_DRAFT', 'CASE_LITIGATION', 'CASE_ARBITRATION', 'CASE_MEDIATION', 'COMPLIANCE', 'TRAINING', 'DOCUMENT_DRAFT', 'OTHER') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `client_id` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'WAITING_CLIENT', 'REVIEWING', 'COMPLETED', 'ARCHIVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `fee_type` ENUM('FIXED', 'HOURLY', 'CONTINGENCY', 'MONTHLY', 'FREE') NOT NULL,
    `fee_amount` DECIMAL(10, 2) NULL,
    `hourly_rate` DECIMAL(10, 2) NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `start_date` DATE NULL,
    `deadline` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `next_action` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `assignee_id` INTEGER NULL,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `matters_matter_no_key`(`matter_no`),
    INDEX `matters_client_id_idx`(`client_id`),
    INDEX `matters_matter_type_idx`(`matter_type`),
    INDEX `matters_status_idx`(`status`),
    INDEX `matters_assignee_id_idx`(`assignee_id`),
    INDEX `matters_deadline_idx`(`deadline`),
    INDEX `matters_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `matter_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `channel` ENUM('WECHAT', 'EMAIL', 'SMS', 'PHONE', 'MEETING', 'VIDEO', 'SYSTEM', 'OTHER') NOT NULL,
    `direction` ENUM('INBOUND', 'OUTBOUND') NOT NULL,
    `subject` VARCHAR(255) NULL,
    `content` TEXT NOT NULL,
    `summary` VARCHAR(500) NULL,
    `attachments` JSON NULL,
    `contact_name` VARCHAR(50) NULL,
    `contact_info` VARCHAR(100) NULL,
    `external_id` VARCHAR(100) NULL,
    `thread_id` VARCHAR(100) NULL,
    `from_addr` VARCHAR(255) NULL,
    `to_addrs` JSON NULL,
    `cc_addrs` JSON NULL,
    `sent_at` DATETIME(0) NOT NULL,
    `read_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `communications_client_id_idx`(`client_id`),
    INDEX `communications_matter_id_idx`(`matter_id`),
    INDEX `communications_channel_idx`(`channel`),
    INDEX `communications_sent_at_idx`(`sent_at`),
    INDEX `communications_external_id_idx`(`external_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `timeline_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matter_id` INTEGER NOT NULL,
    `eventType` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `from_status` VARCHAR(50) NULL,
    `to_status` VARCHAR(50) NULL,
    `metadata` JSON NULL,
    `operator_id` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `timeline_events_matter_id_idx`(`matter_id`),
    INDEX `timeline_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matter_id` INTEGER NULL,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'TODO',
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `due_date` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `reminder_at` DATETIME(0) NULL,
    `is_reminded` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    INDEX `tasks_user_id_idx`(`user_id`),
    INDEX `tasks_status_idx`(`status`),
    INDEX `tasks_due_date_idx`(`due_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_entries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `matter_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `client_id` INTEGER NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `start_time` DATETIME(0) NOT NULL,
    `end_time` DATETIME(0) NULL,
    `duration` INTEGER NULL,
    `hourly_rate` DECIMAL(10, 2) NOT NULL,
    `amount` DECIMAL(10, 2) NULL,
    `is_billable` BOOLEAN NOT NULL DEFAULT true,
    `is_billed` BOOLEAN NOT NULL DEFAULT false,
    `invoice_id` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `time_entries_matter_id_idx`(`matter_id`),
    INDEX `time_entries_user_id_idx`(`user_id`),
    INDEX `time_entries_is_billed_idx`(`is_billed`),
    INDEX `time_entries_start_time_idx`(`start_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_no` VARCHAR(50) NOT NULL,
    `client_id` INTEGER NOT NULL,
    `matter_id` INTEGER NULL,
    `created_by_id` INTEGER NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tax_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'ISSUED', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `issue_date` DATE NULL,
    `due_date` DATE NULL,
    `paid_at` DATETIME(0) NULL,
    `items` JSON NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `invoices_invoice_no_key`(`invoice_no`),
    INDEX `invoices_client_id_idx`(`client_id`),
    INDEX `invoices_status_idx`(`status`),
    INDEX `invoices_issue_date_idx`(`issue_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `file_hash` VARCHAR(64) NULL,
    `client_id` INTEGER NULL,
    `matter_id` INTEGER NULL,
    `uploader_id` INTEGER NULL,
    `category` VARCHAR(50) NULL,
    `tags` JSON NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `documents_client_id_idx`(`client_id`),
    INDEX `documents_matter_id_idx`(`matter_id`),
    INDEX `documents_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enterprise_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `service_level` VARCHAR(20) NOT NULL,
    `response_time` INTEGER NOT NULL,
    `monthly_quota` INTEGER NOT NULL,
    `used_quota` INTEGER NOT NULL DEFAULT 0,
    `oa_webhook_url` VARCHAR(500) NULL,
    `oa_api_key` VARCHAR(255) NULL,
    `oa_api_secret` VARCHAR(255) NULL,
    `dingtalk_token` VARCHAR(255) NULL,
    `wecom_corp_id` VARCHAR(100) NULL,
    `wecom_agent_id` VARCHAR(100) NULL,
    `wecom_secret` VARCHAR(255) NULL,
    `members` JSON NULL,
    `portal_title` VARCHAR(100) NULL,
    `portal_logo` VARCHAR(500) NULL,
    `portal_theme` VARCHAR(20) NULL,
    `custom_fields` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL,

    UNIQUE INDEX `enterprise_configs_client_id_key`(`client_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(50) NOT NULL,
    `resource` VARCHAR(50) NOT NULL,
    `resource_id` INTEGER NULL,
    `method` VARCHAR(10) NULL,
    `path` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `details` JSON NULL,
    `status` VARCHAR(20) NOT NULL,
    `error_msg` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `system_logs_user_id_idx`(`user_id`),
    INDEX `system_logs_action_idx`(`action`),
    INDEX `system_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matters` ADD CONSTRAINT `matters_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matters` ADD CONSTRAINT `matters_assignee_id_fkey` FOREIGN KEY (`assignee_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matters` ADD CONSTRAINT `matters_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communications` ADD CONSTRAINT `communications_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communications` ADD CONSTRAINT `communications_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `communications` ADD CONSTRAINT `communications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `timeline_events` ADD CONSTRAINT `timeline_events_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_entries` ADD CONSTRAINT `time_entries_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_matter_id_fkey` FOREIGN KEY (`matter_id`) REFERENCES `matters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enterprise_configs` ADD CONSTRAINT `enterprise_configs_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
