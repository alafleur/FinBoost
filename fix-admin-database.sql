-- Fix database schema for admin portal functionality
-- This script ensures all tables have the correct structure

-- Check if learning_modules table exists and has correct structure
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_modules' AND column_name='order') THEN
        ALTER TABLE learning_modules ADD COLUMN "order" INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_modules' AND column_name='estimated_minutes') THEN
        ALTER TABLE learning_modules ADD COLUMN estimated_minutes INTEGER DEFAULT 5;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_modules' AND column_name='points_reward') THEN
        ALTER TABLE learning_modules ADD COLUMN points_reward INTEGER DEFAULT 20;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_modules' AND column_name='is_active') THEN
        ALTER TABLE learning_modules ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_modules' AND column_name='category') THEN
        ALTER TABLE learning_modules ADD COLUMN category TEXT DEFAULT 'budgeting';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='learning_modules' AND column_name='difficulty') THEN
        ALTER TABLE learning_modules ADD COLUMN difficulty TEXT DEFAULT 'beginner';
    END IF;
END $$;

-- Insert sample learning modules if table is empty
INSERT INTO learning_modules (title, description, content, category, difficulty, estimated_minutes, points_reward, is_active, "order")
SELECT 
    'Introduction to Budgeting',
    'Learn the fundamentals of creating and managing a personal budget',
    'This module covers the basics of budgeting including income tracking, expense categorization, and budget planning.',
    'budgeting',
    'beginner',
    15,
    25,
    true,
    1
WHERE NOT EXISTS (SELECT 1 FROM learning_modules);

INSERT INTO learning_modules (title, description, content, category, difficulty, estimated_minutes, points_reward, is_active, "order")
SELECT 
    'Emergency Fund Planning',
    'Build your financial safety net with emergency fund strategies',
    'Discover how to calculate the right emergency fund size and strategies for building it efficiently.',
    'savings',
    'beginner',
    20,
    30,
    true,
    2
WHERE (SELECT COUNT(*) FROM learning_modules) < 2;

INSERT INTO learning_modules (title, description, content, category, difficulty, estimated_minutes, points_reward, is_active, "order")
SELECT 
    'Investment Basics',
    'Understanding investment fundamentals and getting started',
    'Learn about different investment types, risk assessment, and building your first investment portfolio.',
    'investing',
    'intermediate',
    25,
    35,
    true,
    3
WHERE (SELECT COUNT(*) FROM learning_modules) < 3;