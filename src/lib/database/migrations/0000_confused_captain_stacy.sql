CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`idea` text NOT NULL,
	`style` text NOT NULL,
	`cover_image` text,
	`world_state` text NOT NULL,
	`status` text DEFAULT 'Draft' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`target_word_count` integer DEFAULT 50000 NOT NULL,
	`settings` text,
	`timeline` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`content` text,
	`status` text DEFAULT 'pending' NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vectors` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`content` text NOT NULL,
	`embedding` text NOT NULL,
	`dimensions` integer NOT NULL,
	`model` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
