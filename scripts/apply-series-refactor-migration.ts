#!/usr/bin/env tsx

/**
 * Migration Script: Refactor Series to Free Containers
 * 
 * This script migrates the series system from purchasable bundles to free containers.
 * 
 * Changes:
 * 1. Sets all series coin_price to 0 and total_price to 0.00
 * 2. Removes access_type and individual_coin_price from series_videos
 * 3. Updates series earnings to reflect sum of video earnings
 * 4. Adds documentation comments to schema
 */

import { db } from '../src/lib/database/connection.js';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    console.log('🚀 Starting series refactor migration...\n');

    try {
        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '../drizzle/0011_refactor_series_to_free_containers.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        console.log('📋 Migration steps:');
        console.log('  1. Update existing series to be free containers');
        console.log('  2. Alter series table defaults');
        console.log('  3. Remove access control columns from series_videos');
        console.log('  4. Drop unused indexes');
        console.log('  5. Add schema documentation');
        console.log('  6. Recalculate series earnings\n');

        // Get current state before migration
        console.log('📊 Pre-migration statistics:');
        
        const seriesCount = await db.execute(sql`SELECT COUNT(*) as count FROM series`);
        console.log(`  - Total series: ${seriesCount.rows[0].count}`);
        
        const paidSeriesCount = await db.execute(sql`SELECT COUNT(*) as count FROM series WHERE coin_price > 0`);
        console.log(`  - Paid series: ${paidSeriesCount.rows[0].count}`);
        
        const seriesVideosCount = await db.execute(sql`SELECT COUNT(*) as count FROM series_videos`);
        console.log(`  - Series-video relationships: ${seriesVideosCount.rows[0].count}`);

        // Check if access_type column exists
        const hasAccessType = await db.execute(sql`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'series_videos' 
                AND column_name = 'access_type'
            ) as exists
        `);
        console.log(`  - Has access_type column: ${hasAccessType.rows[0].exists}\n`);

        // Execute migration
        console.log('⚙️  Executing migration...');
        await db.execute(sql.raw(migrationSQL));
        console.log('✅ Migration SQL executed successfully\n');

        // Verify migration results
        console.log('🔍 Post-migration verification:');
        
        const updatedSeriesCount = await db.execute(sql`SELECT COUNT(*) as count FROM series WHERE coin_price = 0`);
        console.log(`  - Series with coin_price = 0: ${updatedSeriesCount.rows[0].count}`);
        
        const seriesWithEarnings = await db.execute(sql`
            SELECT COUNT(*) as count 
            FROM series 
            WHERE total_earnings::numeric > 0
        `);
        console.log(`  - Series with earnings > 0: ${seriesWithEarnings.rows[0].count}`);

        // Check if columns were removed
        const stillHasAccessType = await db.execute(sql`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'series_videos' 
                AND column_name = 'access_type'
            ) as exists
        `);
        console.log(`  - access_type column removed: ${!stillHasAccessType.rows[0].exists}`);

        const stillHasIndividualPrice = await db.execute(sql`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'series_videos' 
                AND column_name = 'individual_coin_price'
            ) as exists
        `);
        console.log(`  - individual_coin_price column removed: ${!stillHasIndividualPrice.rows[0].exists}\n`);

        // Show sample of updated series
        console.log('📝 Sample of updated series:');
        const sampleSeries = await db.execute(sql`
            SELECT 
                id,
                title,
                coin_price,
                total_price,
                video_count,
                total_earnings
            FROM series
            LIMIT 5
        `);
        
        if (sampleSeries.rows.length > 0) {
            sampleSeries.rows.forEach((series: any) => {
                console.log(`  - ${series.title}`);
                console.log(`    Price: ${series.coin_price} coins (${series.total_price})`);
                console.log(`    Videos: ${series.video_count}, Earnings: ${series.total_earnings}`);
            });
        } else {
            console.log('  - No series found in database');
        }

        console.log('\n✨ Migration completed successfully!');
        console.log('\n📌 Summary:');
        console.log('  - All series are now free organizational containers');
        console.log('  - Videos maintain their individual pricing (0-2000 coins)');
        console.log('  - Series earnings reflect sum of video earnings');
        console.log('  - Access control simplified to video-level pricing\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.error('\n⚠️  Please check the error above and try again.');
        console.error('If the error persists, you may need to manually review the database state.\n');
        process.exit(1);
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('🎉 All done! Series refactor migration completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
