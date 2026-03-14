-- Migration: Refactor series to free containers
-- Description: Convert series from purchasable bundles to free organizational containers
-- Date: 2024

-- Step 1: Update existing series to be free containers
UPDATE series 
SET 
    coin_price = 0,
    total_price = '0.00'
WHERE coin_price > 0 OR total_price != '0.00';

-- Step 2: Alter series table to make pricing optional (set defaults)
ALTER TABLE series 
    ALTER COLUMN coin_price SET DEFAULT 0,
    ALTER COLUMN total_price SET DEFAULT '0.00';

-- Step 3: Remove access control columns from series_videos table
-- First, check if columns exist before dropping
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'series_videos' 
        AND column_name = 'access_type'
    ) THEN
        ALTER TABLE series_videos DROP COLUMN access_type;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'series_videos' 
        AND column_name = 'individual_coin_price'
    ) THEN
        ALTER TABLE series_videos DROP COLUMN individual_coin_price;
    END IF;
END $$;

-- Step 4: Drop the access_type index if it exists
DROP INDEX IF EXISTS series_videos_access_type_idx;

-- Step 5: Add comments to document the new model
COMMENT ON COLUMN series.coin_price IS 'Deprecated - Series is now a free container. Always 0.';
COMMENT ON COLUMN series.total_price IS 'Deprecated - Series is now a free container. Always 0.00.';
COMMENT ON TABLE series IS 'Series are free organizational containers. Videos within series have individual pricing.';
COMMENT ON TABLE series_videos IS 'Junction table linking videos to series. Videos use their own coin_price for monetization.';

-- Step 6: Update series total_earnings to be sum of video earnings
-- This ensures existing series show correct earnings from their videos
UPDATE series s
SET total_earnings = COALESCE(
    (
        SELECT SUM(v.total_earnings::numeric)
        FROM videos v
        INNER JOIN series_videos sv ON sv.video_id = v.id
        WHERE sv.series_id = s.id
    ),
    0
)::decimal(10,2);

-- Step 7: Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Series refactored to free containers';
    RAISE NOTICE 'All series now have coin_price = 0 and total_price = 0.00';
    RAISE NOTICE 'Videos maintain their individual pricing';
END $$;
