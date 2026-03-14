-- Rollback Migration: Restore series purchasable bundle model
-- WARNING: This rollback is provided for emergency use only
-- Data loss may occur if series were created after the migration

-- Step 1: Re-add access control columns to series_videos if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'series_videos' 
        AND column_name = 'access_type'
    ) THEN
        ALTER TABLE series_videos 
        ADD COLUMN access_type VARCHAR(20) DEFAULT 'series-only' NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'series_videos' 
        AND column_name = 'individual_coin_price'
    ) THEN
        ALTER TABLE series_videos 
        ADD COLUMN individual_coin_price INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 2: Recreate the access_type index
CREATE INDEX IF NOT EXISTS series_videos_access_type_idx ON series_videos(access_type);

-- Step 3: Restore series pricing (set to a default value)
-- WARNING: Original series prices are lost - this sets all to 100 coins
UPDATE series 
SET 
    coin_price = 100,
    total_price = '5.00'
WHERE coin_price = 0;

-- Step 4: Alter series table to make pricing required again
ALTER TABLE series 
    ALTER COLUMN coin_price SET NOT NULL,
    ALTER COLUMN total_price SET NOT NULL;

-- Step 5: Remove comments
COMMENT ON COLUMN series.coin_price IS NULL;
COMMENT ON COLUMN series.total_price IS NULL;
COMMENT ON TABLE series IS NULL;
COMMENT ON TABLE series_videos IS NULL;

-- Step 6: Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'Rollback completed: Series restored to purchasable bundle model';
    RAISE NOTICE 'WARNING: Original series prices were not preserved';
    RAISE NOTICE 'All series now have default price of 100 coins';
END $$;
