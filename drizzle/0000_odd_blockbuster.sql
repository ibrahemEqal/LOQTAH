CREATE TABLE `creator_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`city` text NOT NULL,
	`category` text NOT NULL,
	`portfolio` text NOT NULL,
	`bio` text NOT NULL,
	`phone` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creator_applications_user_id_unique` ON `creator_applications` (`user_id`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`business` text NOT NULL,
	`category` text NOT NULL,
	`city` text NOT NULL,
	`brief` text NOT NULL,
	`package_id` text NOT NULL,
	`budget` integer NOT NULL,
	`date` text NOT NULL,
	`creator_id` text,
	`status` text DEFAULT 'requested' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `campaigns_user_idx` ON `campaigns` (`user_id`);--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`status` text DEFAULT 'review' NOT NULL,
	`feedback` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`user_id` text NOT NULL,
	`creator_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `creator_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`campaign_id` text NOT NULL,
	`author_id` text NOT NULL,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`is_team` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_campaign_idx` ON `messages` (`campaign_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`business` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`city` text DEFAULT 'نابلس' NOT NULL,
	`created_at` integer NOT NULL
);
