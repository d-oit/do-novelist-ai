CREATE TABLE `analysis_results` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`analysis_type` text NOT NULL,
	`result_data` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `character_graphs` (
	`project_id` text PRIMARY KEY NOT NULL,
	`nodes` text NOT NULL,
	`relationships` text NOT NULL,
	`analyzed_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plot_holes` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`affected_chapters` text,
	`affected_characters` text,
	`suggested_fix` text,
	`confidence` real NOT NULL,
	`detected` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plot_structures` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`acts` text,
	`climax` text,
	`resolution` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plot_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`placement` text,
	`impact` text,
	`related_characters` text,
	`prerequisites` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `story_arcs` (
	`project_id` text PRIMARY KEY NOT NULL,
	`structure` text NOT NULL,
	`pacing` text NOT NULL,
	`tension` text NOT NULL,
	`coherence` real NOT NULL,
	`recommendations` text NOT NULL,
	`analyzed_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `device_registry` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text NOT NULL,
	`last_seen_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_registry_device_id_unique` ON `device_registry` (`device_id`);--> statement-breakpoint
CREATE TABLE `model_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`cache_key` text NOT NULL,
	`data` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `model_cache_cache_key_unique` ON `model_cache` (`cache_key`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_id` text,
	`theme` text DEFAULT 'system' NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`onboarding_complete` integer DEFAULT false NOT NULL,
	`onboarding_step` text DEFAULT 'welcome',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `agent_handoffs` (
	`id` text PRIMARY KEY NOT NULL,
	`from_agent_id` text NOT NULL,
	`to_agent_id` text NOT NULL,
	`task_id` text NOT NULL,
	`handoff_reason` text NOT NULL,
	`context_data` text,
	`timestamp` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `agent_instances` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`agent_type` text NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`project_id` text,
	`current_task` text,
	`handoff_target` text,
	`metadata` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_instances_agent_id_unique` ON `agent_instances` (`agent_id`);--> statement-breakpoint
CREATE TABLE `agent_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`total_decisions` integer DEFAULT 0 NOT NULL,
	`successful_decisions` integer DEFAULT 0 NOT NULL,
	`failed_decisions` integer DEFAULT 0 NOT NULL,
	`average_decision_time_ms` integer DEFAULT 0 NOT NULL,
	`total_tasks` integer DEFAULT 0 NOT NULL,
	`completed_tasks` integer DEFAULT 0 NOT NULL,
	`failed_tasks` integer DEFAULT 0 NOT NULL,
	`handoffs_initiated` integer DEFAULT 0 NOT NULL,
	`handoffs_received` integer DEFAULT 0 NOT NULL,
	`last_active_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_metrics_agent_id_unique` ON `agent_metrics` (`agent_id`);--> statement-breakpoint
CREATE TABLE `agent_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`agent_id` text NOT NULL,
	`task_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`input_data` text,
	`output_data` text,
	`error_message` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`created_at` text NOT NULL,
	`started_at` text,
	`completed_at` text
);
--> statement-breakpoint
CREATE TABLE `plot_engine_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text,
	`feedback_type` text NOT NULL,
	`content` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ai_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text,
	`model` text,
	`temperature` integer,
	`max_tokens` integer,
	`preferences` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_preferences_user_id_unique` ON `ai_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `key_value_store` (
	`id` text PRIMARY KEY NOT NULL,
	`namespace` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`user_id` text,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
DROP INDEX "device_registry_device_id_unique";--> statement-breakpoint
DROP INDEX "model_cache_cache_key_unique";--> statement-breakpoint
DROP INDEX "user_settings_user_id_unique";--> statement-breakpoint
DROP INDEX "agent_instances_agent_id_unique";--> statement-breakpoint
DROP INDEX "agent_metrics_agent_id_unique";--> statement-breakpoint
DROP INDEX "ai_preferences_user_id_unique";--> statement-breakpoint
ALTER TABLE `world_maps` ALTER COLUMN "image_url" TO "image_url" text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `word_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `chapters` ADD `character_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `chapters` ADD `estimated_reading_time` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `chapters` ADD `tags` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `chapters` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `created_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `chapters` ADD `updated_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `chapters` ADD `generation_prompt` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `ai_model` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `generation_settings` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `plot_points` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `characters` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `locations` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `scenes` text;--> statement-breakpoint
ALTER TABLE `chapters` ADD `illustration` text;--> statement-breakpoint
ALTER TABLE `branches` ADD `chapter_id` text;--> statement-breakpoint
ALTER TABLE `branches` ADD `parent_version_id` text;--> statement-breakpoint
ALTER TABLE `branches` ADD `color` text;--> statement-breakpoint
ALTER TABLE `chapter_versions` ADD `status` text;--> statement-breakpoint
ALTER TABLE `chapter_versions` ADD `type` text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE `chapter_versions` ADD `content_hash` text;--> statement-breakpoint
ALTER TABLE `chapter_versions` ADD `word_count` integer;--> statement-breakpoint
ALTER TABLE `chapter_versions` ADD `char_count` integer;