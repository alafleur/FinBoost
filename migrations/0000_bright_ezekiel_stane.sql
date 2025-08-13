CREATE TABLE "admin_points_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"name" text NOT NULL,
	"base_points" integer NOT NULL,
	"max_daily" integer,
	"max_monthly" integer,
	"max_total" integer,
	"requires_proof" boolean DEFAULT false NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "admin_points_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "cycle_point_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cycle_setting_id" integer NOT NULL,
	"points" integer NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"related_id" integer,
	"status" text DEFAULT 'approved' NOT NULL,
	"proof_url" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cycle_points_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"name" text NOT NULL,
	"base_points" integer NOT NULL,
	"max_daily" integer,
	"max_per_cycle" integer,
	"max_total" integer,
	"requires_proof" boolean DEFAULT false NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer,
	CONSTRAINT "cycle_points_actions_action_id_unique" UNIQUE("action_id")
);
--> statement-breakpoint
CREATE TABLE "cycle_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_name" text NOT NULL,
	"cycle_type" text NOT NULL,
	"cycle_start_date" timestamp NOT NULL,
	"cycle_end_date" timestamp NOT NULL,
	"payment_period_days" integer NOT NULL,
	"membership_fee" integer NOT NULL,
	"reward_pool_percentage" integer NOT NULL,
	"minimum_pool_guarantee" integer DEFAULT 0 NOT NULL,
	"tier1_threshold" integer DEFAULT 33 NOT NULL,
	"tier2_threshold" integer DEFAULT 67 NOT NULL,
	"tier1_pool_percentage" integer DEFAULT 50 NOT NULL,
	"tier2_pool_percentage" integer DEFAULT 35 NOT NULL,
	"tier3_pool_percentage" integer DEFAULT 15 NOT NULL,
	"selection_percentage" integer DEFAULT 50 NOT NULL,
	"winner_point_deduction_percentage" integer DEFAULT 80 NOT NULL,
	"mid_cycle_join_threshold_days" integer DEFAULT 3 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"completed_at" timestamp,
	"completed_by" integer,
	"selection_executed" boolean DEFAULT false NOT NULL,
	"selection_sealed" boolean DEFAULT false NOT NULL,
	"total_winners" integer DEFAULT 0 NOT NULL,
	"total_reward_pool" integer DEFAULT 0 NOT NULL,
	"selection_executed_at" timestamp,
	"selection_sealed_at" timestamp,
	"selection_sealed_by" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "cycle_winner_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_setting_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"tier" text NOT NULL,
	"overall_rank" integer NOT NULL,
	"tier_rank" integer NOT NULL,
	"points_at_selection" integer NOT NULL,
	"tier_size_amount" integer NOT NULL,
	"payout_percentage" integer DEFAULT 0 NOT NULL,
	"payout_calculated" integer DEFAULT 0 NOT NULL,
	"payout_override" integer,
	"payout_final" integer DEFAULT 0 NOT NULL,
	"reward_amount" integer NOT NULL,
	"points_deducted" integer NOT NULL,
	"points_rolled_over" integer NOT NULL,
	"payout_status" text DEFAULT 'draft' NOT NULL,
	"last_modified" timestamp DEFAULT now() NOT NULL,
	"selection_date" timestamp DEFAULT now() NOT NULL,
	"state_transitions" text,
	"processing_attempts" integer DEFAULT 0 NOT NULL,
	"last_processing_attempt" timestamp,
	"paypal_batch_id" text,
	"paypal_item_id" text,
	"failure_reason" text,
	"admin_notes" text,
	"is_sealed" boolean DEFAULT false NOT NULL,
	"sealed_at" timestamp,
	"sealed_by" integer,
	"saved_at" timestamp DEFAULT now() NOT NULL,
	"saved_by" integer NOT NULL,
	"notification_displayed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"quiz" text,
	"points_reward" integer DEFAULT 10 NOT NULL,
	"category" text NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"estimated_minutes" integer DEFAULT 5 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"access_type" text DEFAULT 'free' NOT NULL,
	"published_at" timestamp,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"total_reward_pool" integer NOT NULL,
	"total_participants" integer NOT NULL,
	"gold_tier_participants" integer DEFAULT 0 NOT NULL,
	"silver_tier_participants" integer DEFAULT 0 NOT NULL,
	"bronze_tier_participants" integer DEFAULT 0 NOT NULL,
	"gold_reward_percentage" integer DEFAULT 50 NOT NULL,
	"silver_reward_percentage" integer DEFAULT 30 NOT NULL,
	"bronze_reward_percentage" integer DEFAULT 20 NOT NULL,
	"point_deduction_percentage" integer DEFAULT 75 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"distributed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "payout_batch_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"chunk_index" integer NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"items_count" integer NOT NULL,
	"processed_items" integer DEFAULT 0 NOT NULL,
	"sender_batch_id" text,
	"paypal_batch_id" text,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_batch_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"chunk_id" integer,
	"selection_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"receiver_email" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"sender_item_id" text NOT NULL,
	"paypal_item_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"paypal_transaction_status" text,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_setting_id" integer NOT NULL,
	"sender_batch_id" text NOT NULL,
	"request_checksum" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'intent' NOT NULL,
	"admin_id" integer NOT NULL,
	"paypal_batch_id" text,
	"total_amount" integer NOT NULL,
	"total_recipients" integer NOT NULL,
	"successful_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"pending_count" integer DEFAULT 0 NOT NULL,
	"error_details" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"last_retry_error" text,
	"superseded_by_id" integer,
	"is_chunked" boolean DEFAULT false NOT NULL,
	"total_chunks" integer DEFAULT 1 NOT NULL,
	"completed_chunks" integer DEFAULT 0 NOT NULL,
	"chunk_size" integer DEFAULT 500 NOT NULL,
	"expected_item_count" integer,
	"payload_checksum" text,
	"parent_batch_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payout_batches_sender_batch_id_unique" UNIQUE("sender_batch_id"),
	CONSTRAINT "payout_batches_cycle_checksum_attempt_unique" UNIQUE("cycle_setting_id","request_checksum","attempt")
);
--> statement-breakpoint
CREATE TABLE "paypal_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"paypal_payout_id" text,
	"paypal_item_id" text,
	"recipient_email" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"reason" text NOT NULL,
	"tier" text,
	"points_used" integer DEFAULT 0,
	"admin_notes" text,
	"processed_at" timestamp,
	"paypal_response" text,
	"cycle_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prediction_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_setting_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"options" text NOT NULL,
	"submission_deadline" timestamp NOT NULL,
	"result_determination_time" timestamp NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"correct_answer_index" integer,
	"point_awards" text,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"results_published" boolean DEFAULT false NOT NULL,
	"points_distributed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"published_at" timestamp,
	"closed_at" timestamp,
	"completed_at" timestamp,
	"completed_by" integer
);
--> statement-breakpoint
CREATE TABLE "prediction_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"prediction_question_id" integer NOT NULL,
	"correct_answer_index" integer NOT NULL,
	"total_participants" integer NOT NULL,
	"option_stats" text NOT NULL,
	"total_points_awarded" integer NOT NULL,
	"points_per_option" text NOT NULL,
	"determined_at" timestamp DEFAULT now() NOT NULL,
	"determined_by" integer NOT NULL,
	"points_distributed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_user_id" integer NOT NULL,
	"referred_user_id" integer NOT NULL,
	"referral_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_distribution_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" integer
);
--> statement-breakpoint
CREATE TABLE "stripe_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"stripe_invoice_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"payment_type" text NOT NULL,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"stripe_payout_id" text,
	"stripe_transfer_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"status" text NOT NULL,
	"reason" text NOT NULL,
	"points_used" integer DEFAULT 0,
	"admin_notes" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "support_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"category" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"priority" varchar(50) DEFAULT 'normal',
	"has_attachment" boolean DEFAULT false,
	"file_name" varchar(255),
	"response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_cycle_points" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"cycle_setting_id" integer NOT NULL,
	"current_cycle_points" integer DEFAULT 0 NOT NULL,
	"theoretical_points" integer DEFAULT 0 NOT NULL,
	"tier" text DEFAULT 'tier3' NOT NULL,
	"joined_cycle_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_date" timestamp,
	"points_rolled_over" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_monthly_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"monthly_reward_id" integer NOT NULL,
	"tier" text NOT NULL,
	"points_at_distribution" integer NOT NULL,
	"reward_amount" integer DEFAULT 0 NOT NULL,
	"points_deducted" integer DEFAULT 0 NOT NULL,
	"points_rolled_over" integer NOT NULL,
	"is_winner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_points_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"points" integer NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"related_id" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"proof_url" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"prediction_question_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"selected_option_index" integer NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	"points_distributed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"referral_code" text NOT NULL,
	"total_referrals" integer DEFAULT 0 NOT NULL,
	"total_points_earned" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_referral_codes_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"current_month_points" integer DEFAULT 0 NOT NULL,
	"tier" text DEFAULT 'bronze' NOT NULL,
	"bio" text,
	"location" text,
	"occupation" text,
	"financial_goals" text,
	"referred_by" text,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" text,
	"last_streak_bonus_date" text,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"subscription_status" text DEFAULT 'inactive',
	"subscription_amount" integer DEFAULT 2000,
	"subscription_currency" text DEFAULT 'usd',
	"subscription_payment_method" text,
	"subscription_start_date" timestamp,
	"last_payment_date" timestamp,
	"next_billing_date" timestamp,
	"last_payment_amount" integer,
	"last_payment_status" text,
	"stripe_connect_account_id" text,
	"connect_onboarding_complete" boolean DEFAULT false,
	"payout_eligible" boolean DEFAULT false,
	"membership_bonus_received" boolean DEFAULT false,
	"theoretical_points" integer DEFAULT 0 NOT NULL,
	"paypal_email" text,
	"payout_method" text DEFAULT 'paypal',
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "winner_allocation_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text NOT NULL,
	"tier" text NOT NULL,
	"tier_rank" integer NOT NULL,
	"reward_percentage" integer NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE "winner_selection_cycles" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_name" text NOT NULL,
	"cycle_start_date" timestamp NOT NULL,
	"cycle_end_date" timestamp NOT NULL,
	"pool_settings" text,
	"tier1_threshold" integer DEFAULT 33,
	"tier2_threshold" integer DEFAULT 67,
	"selection_percentage" integer DEFAULT 50,
	"selection_completed" boolean DEFAULT false NOT NULL,
	"disbursement_completed" boolean DEFAULT false NOT NULL,
	"total_pool_amount" integer DEFAULT 0,
	"total_reward_pool" integer DEFAULT 0,
	"tier1_pool" integer DEFAULT 0,
	"tier2_pool" integer DEFAULT 0,
	"tier3_pool" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "winner_selections" (
	"id" serial PRIMARY KEY NOT NULL,
	"cycle_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"tier" text NOT NULL,
	"tier_rank" integer NOT NULL,
	"reward_percentage" integer DEFAULT 0,
	"reward_amount" integer DEFAULT 0,
	"paypal_email" text,
	"disbursed" boolean DEFAULT false NOT NULL,
	"disbursement_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_points_actions" ADD CONSTRAINT "admin_points_actions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_point_history" ADD CONSTRAINT "cycle_point_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_point_history" ADD CONSTRAINT "cycle_point_history_cycle_setting_id_cycle_settings_id_fk" FOREIGN KEY ("cycle_setting_id") REFERENCES "public"."cycle_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_point_history" ADD CONSTRAINT "cycle_point_history_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_points_actions" ADD CONSTRAINT "cycle_points_actions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_settings" ADD CONSTRAINT "cycle_settings_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_settings" ADD CONSTRAINT "cycle_settings_selection_sealed_by_users_id_fk" FOREIGN KEY ("selection_sealed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_settings" ADD CONSTRAINT "cycle_settings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_winner_selections" ADD CONSTRAINT "cycle_winner_selections_cycle_setting_id_cycle_settings_id_fk" FOREIGN KEY ("cycle_setting_id") REFERENCES "public"."cycle_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_winner_selections" ADD CONSTRAINT "cycle_winner_selections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_winner_selections" ADD CONSTRAINT "cycle_winner_selections_sealed_by_users_id_fk" FOREIGN KEY ("sealed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cycle_winner_selections" ADD CONSTRAINT "cycle_winner_selections_saved_by_users_id_fk" FOREIGN KEY ("saved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_cycle_setting_id_cycle_settings_id_fk" FOREIGN KEY ("cycle_setting_id") REFERENCES "public"."cycle_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paypal_payouts" ADD CONSTRAINT "paypal_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_questions" ADD CONSTRAINT "prediction_questions_cycle_setting_id_cycle_settings_id_fk" FOREIGN KEY ("cycle_setting_id") REFERENCES "public"."cycle_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_questions" ADD CONSTRAINT "prediction_questions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_questions" ADD CONSTRAINT "prediction_questions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_results" ADD CONSTRAINT "prediction_results_prediction_question_id_prediction_questions_id_fk" FOREIGN KEY ("prediction_question_id") REFERENCES "public"."prediction_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prediction_results" ADD CONSTRAINT "prediction_results_determined_by_users_id_fk" FOREIGN KEY ("determined_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward_distribution_settings" ADD CONSTRAINT "reward_distribution_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_payments" ADD CONSTRAINT "stripe_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stripe_payouts" ADD CONSTRAINT "stripe_payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cycle_points" ADD CONSTRAINT "user_cycle_points_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cycle_points" ADD CONSTRAINT "user_cycle_points_cycle_setting_id_cycle_settings_id_fk" FOREIGN KEY ("cycle_setting_id") REFERENCES "public"."cycle_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_monthly_rewards" ADD CONSTRAINT "user_monthly_rewards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_monthly_rewards" ADD CONSTRAINT "user_monthly_rewards_monthly_reward_id_monthly_rewards_id_fk" FOREIGN KEY ("monthly_reward_id") REFERENCES "public"."monthly_rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points_history" ADD CONSTRAINT "user_points_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_points_history" ADD CONSTRAINT "user_points_history_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_predictions" ADD CONSTRAINT "user_predictions_prediction_question_id_prediction_questions_id_fk" FOREIGN KEY ("prediction_question_id") REFERENCES "public"."prediction_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_predictions" ADD CONSTRAINT "user_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_referral_codes" ADD CONSTRAINT "user_referral_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner_allocation_templates" ADD CONSTRAINT "winner_allocation_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner_selection_cycles" ADD CONSTRAINT "winner_selection_cycles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner_selections" ADD CONSTRAINT "winner_selections_cycle_id_winner_selection_cycles_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."winner_selection_cycles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "winner_selections" ADD CONSTRAINT "winner_selections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payout_batch_chunks_batch_chunk" ON "payout_batch_chunks" USING btree ("batch_id","chunk_index");--> statement-breakpoint
CREATE INDEX "idx_payout_batch_chunks_batch" ON "payout_batch_chunks" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_payout_batch_chunks_status" ON "payout_batch_chunks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payout_batch_items_sender_item" ON "payout_batch_items" USING btree ("sender_item_id");--> statement-breakpoint
CREATE INDEX "idx_payout_batch_items_batch" ON "payout_batch_items" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_payout_batch_items_chunk" ON "payout_batch_items" USING btree ("chunk_id");--> statement-breakpoint
CREATE INDEX "idx_payout_batch_items_selection" ON "payout_batch_items" USING btree ("selection_id");--> statement-breakpoint
CREATE INDEX "idx_payout_batch_items_status" ON "payout_batch_items" USING btree ("status");