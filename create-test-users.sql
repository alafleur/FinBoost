-- Script to create 100 test users with realistic data
DO $$
DECLARE
    first_names text[] := ARRAY[
        'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth',
        'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
        'Charles', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Helen', 'Mark', 'Sandra',
        'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth', 'Andrew', 'Sharon', 'Joshua', 'Michelle',
        'Kenneth', 'Laura', 'Kevin', 'Kimberly', 'Brian', 'Deborah', 'George', 'Dorothy', 'Timothy', 'Lisa'
    ];
    
    last_names text[] := ARRAY[
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
        'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
        'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
        'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
    ];
    
    first_name text;
    last_name text;
    username text;
    email text;
    total_points integer;
    current_month_points integer;
    user_tier text;
    current_streak integer;
    longest_streak integer;
    hashed_password text;
    i integer;
BEGIN
    -- Generate password hash for 'testpass123'
    hashed_password := '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; -- bcrypt hash for 'testpass123'
    
    FOR i IN 1..100 LOOP
        -- Generate random names
        first_name := first_names[1 + (random() * (array_length(first_names, 1) - 1))::integer];
        last_name := last_names[1 + (random() * (array_length(last_names, 1) - 1))::integer];
        
        -- Create username and email
        username := lower(first_name || last_name || i::text);
        email := username || '@testuser.com';
        
        -- Generate realistic points (0-500 range)
        total_points := (random() * 500)::integer;
        current_month_points := (random() * 100)::integer;
        
        -- Determine tier based on points
        IF total_points >= 150 THEN
            user_tier := 'gold';
        ELSIF total_points >= 50 THEN
            user_tier := 'silver';
        ELSE
            user_tier := 'bronze';
        END IF;
        
        -- Generate streaks
        current_streak := (random() * 30)::integer;
        longest_streak := current_streak + (random() * 20)::integer;
        
        -- Insert user (skip if already exists)
        BEGIN
            INSERT INTO users (
                username, email, password, first_name, last_name,
                total_points, current_month_points, tier,
                current_streak, longest_streak, is_active
            ) VALUES (
                username, email, hashed_password, first_name, last_name,
                total_points, current_month_points, user_tier,
                current_streak, longest_streak, true
            );
        EXCEPTION WHEN unique_violation THEN
            -- Skip if user already exists
            CONTINUE;
        END;
        
        -- Progress indicator
        IF i % 10 = 0 THEN
            RAISE NOTICE 'Created % users...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed creating test users!';
END $$;