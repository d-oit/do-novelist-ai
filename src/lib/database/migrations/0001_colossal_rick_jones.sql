CREATE TABLE `characters` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`description` text,
	`personality` text,
	`background` text,
	`goals` text,
	`conflicts` text,
	`arc` text,
	`appearance` text,
	`age` integer,
	`occupation` text,
	`skills` text,
	`weaknesses` text,
	`relationships` text,
	`notes` text,
	`image_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `cultures` (
	`id` text PRIMARY KEY NOT NULL,
	`world_building_project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`values` text,
	`traditions` text,
	`beliefs` text,
	`language` text,
	`social_structure` text,
	`customs` text,
	`arts` text,
	`technology` text,
	`location_ids` text,
	`tags` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`world_building_project_id`) REFERENCES `world_building_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`world_building_project_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`climate` text,
	`geography` text,
	`population` integer,
	`government` text,
	`economy` text,
	`culture` text,
	`history` text,
	`significance` text,
	`parent_location_id` text,
	`coordinates` text,
	`tags` text,
	`image_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`world_building_project_id`) REFERENCES `world_building_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lore_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`world_building_project_id` text NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`content` text NOT NULL,
	`related_entries` text,
	`tags` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`world_building_project_id`) REFERENCES `world_building_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `research_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`world_building_project_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`author` text,
	`url` text,
	`notes` text,
	`tags` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`world_building_project_id`) REFERENCES `world_building_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `timelines` (
	`id` text PRIMARY KEY NOT NULL,
	`world_building_project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`events` text,
	`start_date` text,
	`end_date` text,
	`tags` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`world_building_project_id`) REFERENCES `world_building_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `world_building_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `world_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`world_building_project_id` text NOT NULL,
	`name` text NOT NULL,
	`image_url` text NOT NULL,
	`scale` text,
	`legend` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`world_building_project_id`) REFERENCES `world_building_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT false NOT NULL,
	`created_from` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `chapter_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`chapter_id` text NOT NULL,
	`version_number` integer NOT NULL,
	`content` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`message` text,
	`author_name` text NOT NULL,
	`branch_id` text,
	`parent_version_id` text,
	`tags` text,
	`metadata` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `export_history` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`format` text NOT NULL,
	`status` text NOT NULL,
	`file_url` text,
	`file_size` integer,
	`error_message` text,
	`metadata` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `platform_status` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`platform` text NOT NULL,
	`status` text NOT NULL,
	`published_url` text,
	`last_synced_at` text,
	`error_message` text,
	`configuration` text,
	`metrics` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `publishing_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`platform` text NOT NULL,
	`metric_type` text NOT NULL,
	`value` real NOT NULL,
	`unit` text,
	`period` text,
	`metadata` text,
	`recorded_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `analysis_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`chapter_id` text NOT NULL,
	`project_id` text NOT NULL,
	`readability_score` real NOT NULL,
	`engagement_score` real NOT NULL,
	`sentiment_score` real NOT NULL,
	`pace_score` real NOT NULL,
	`suggestion_count` integer NOT NULL,
	`suggestion_categories` text,
	`accepted_suggestions` integer DEFAULT 0 NOT NULL,
	`dismissed_suggestions` integer DEFAULT 0 NOT NULL,
	`analysis_depth` text NOT NULL,
	`content_word_count` integer NOT NULL,
	`timestamp` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `suggestion_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`suggestion_type` text NOT NULL,
	`suggestion_category` text NOT NULL,
	`action` text NOT NULL,
	`context` text,
	`chapter_id` text,
	`project_id` text,
	`timestamp` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `user_writing_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`preferences` text,
	`last_synced_at` text NOT NULL,
	`device_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `writing_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text,
	`goal_type` text NOT NULL,
	`target_value` integer NOT NULL,
	`current_value` integer DEFAULT 0 NOT NULL,
	`unit` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`is_active` integer DEFAULT true NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
