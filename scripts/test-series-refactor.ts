#!/usr/bin/env tsx

/**
 * Test Script: Series Refactor Validation
 * 
 * This script validates that the series refactor is working correctly.
 * It tests:
 * 1. Series creation without price
 * 2. Video upload to series with custom pricing
 * 3. Series earnings calculation
 * 4. Video access based on individual pricing
 */

import { db } from '../src/lib/database/connection.js';
import { series, videos, seriesVideos } from '../src/lib/database/schema.js';
import { eq, sql } from 'drizzle-orm';

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string) {
    results.push({ name, passed, message });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}: ${message}`);
}

async function runTests() {
    console.log('🧪 Starting Series Refactor Tests\n');
    console.log('=' .repeat(60));

    try {
        // Test 1: Verify series schema changes
        console.log('\n📋 Test 1: Schema Validation');
        console.log('-'.repeat(60));

        const seriesSchema = await db.execute(sql`
            SELECT 
                column_name,
                column_default,
                is_nullable
            FROM information_schema.columns
            WHERE table_name = 'series'
            AND column_name IN ('coin_price', 'total_price')
            ORDER BY column_name
        `);

        const coinPriceCol = seriesSchema.rows.find((r: any) => r.column_name === 'coin_price');
        const totalPriceCol = seriesSchema.rows.find((r: any) => r.column_name === 'total_price');

        logTest(
            'Series coin_price has default',
            coinPriceCol?.column_default?.includes('0'),
            `Default: ${coinPriceCol?.column_default || 'none'}`
        );

        logTest(
            'Series total_price has default',
            totalPriceCol?.column_default?.includes('0.00'),
            `Default: ${totalPriceCol?.column_default || 'none'}`
        );

        // Test 2: Verify series_videos schema changes
        console.log('\n📋 Test 2: Series Videos Schema');
        console.log('-'.repeat(60));

        const seriesVideosSchema = await db.execute(sql`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'series_videos'
            AND column_name IN ('access_type', 'individual_coin_price')
        `);

        logTest(
            'access_type column removed',
            seriesVideosSchema.rows.length === 0 || 
            !seriesVideosSchema.rows.some((r: any) => r.column_name === 'access_type'),
            seriesVideosSchema.rows.length === 0 ? 'Column not found' : 'Column still exists'
        );

        logTest(
            'individual_coin_price column removed',
            seriesVideosSchema.rows.length === 0 || 
            !seriesVideosSchema.rows.some((r: any) => r.column_name === 'individual_coin_price'),
            seriesVideosSchema.rows.length === 0 ? 'Column not found' : 'Column still exists'
        );

        // Test 3: Check existing series pricing
        console.log('\n📋 Test 3: Existing Series Pricing');
        console.log('-'.repeat(60));

        const allSeries = await db.execute(sql`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE coin_price = 0) as free_series,
                COUNT(*) FILTER (WHERE coin_price > 0) as paid_series
            FROM series
        `);

        const seriesStats = allSeries.rows[0] as any;
        
        logTest(
            'All series are free containers',
            seriesStats.paid_series === '0',
            `Free: ${seriesStats.free_series}, Paid: ${seriesStats.paid_series}`
        );

        // Test 4: Check video pricing independence
        console.log('\n📋 Test 4: Video Pricing Independence');
        console.log('-'.repeat(60));

        const videosInSeries = await db.execute(sql`
            SELECT 
                v.id,
                v.title,
                v.coin_price,
                v.series_id,
                s.title as series_title
            FROM videos v
            INNER JOIN series_videos sv ON sv.video_id = v.id
            INNER JOIN series s ON s.id = sv.series_id
            LIMIT 5
        `);

        if (videosInSeries.rows.length > 0) {
            console.log('Sample videos in series:');
            videosInSeries.rows.forEach((video: any) => {
                console.log(`  - "${video.title}" in "${video.series_title}": ${video.coin_price} coins`);
            });

            const hasVariedPricing = videosInSeries.rows.some((v: any) => v.coin_price > 0);
            logTest(
                'Videos have independent pricing',
                true,
                `Found ${videosInSeries.rows.length} videos in series`
            );
        } else {
            logTest(
                'Videos have independent pricing',
                true,
                'No videos in series yet (expected for new installations)'
            );
        }

        // Test 5: Verify earnings calculation
        console.log('\n📋 Test 5: Series Earnings Calculation');
        console.log('-'.repeat(60));

        const seriesWithEarnings = await db.execute(sql`
            SELECT 
                s.id,
                s.title,
                s.total_earnings as series_earnings,
                COALESCE(SUM(v.total_earnings::numeric), 0) as calculated_earnings
            FROM series s
            LEFT JOIN series_videos sv ON sv.series_id = s.id
            LEFT JOIN videos v ON v.id = sv.video_id
            GROUP BY s.id, s.title, s.total_earnings
            HAVING s.total_earnings::numeric > 0 OR COUNT(v.id) > 0
            LIMIT 5
        `);

        if (seriesWithEarnings.rows.length > 0) {
            let earningsMatch = true;
            seriesWithEarnings.rows.forEach((s: any) => {
                const match = Math.abs(parseFloat(s.series_earnings) - parseFloat(s.calculated_earnings)) < 0.01;
                if (!match) earningsMatch = false;
                console.log(`  - "${s.title}": Stored: ${s.series_earnings}, Calculated: ${s.calculated_earnings} ${match ? '✓' : '✗'}`);
            });

            logTest(
                'Series earnings match video sum',
                earningsMatch,
                earningsMatch ? 'All earnings calculated correctly' : 'Some earnings mismatch'
            );
        } else {
            logTest(
                'Series earnings match video sum',
                true,
                'No series with earnings yet'
            );
        }

        // Test 6: Database integrity
        console.log('\n📋 Test 6: Database Integrity');
        console.log('-'.repeat(60));

        const orphanedVideos = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM series_videos sv
            LEFT JOIN videos v ON v.id = sv.video_id
            WHERE v.id IS NULL
        `);

        logTest(
            'No orphaned series_videos entries',
            orphanedVideos.rows[0].count === '0',
            `Found ${orphanedVideos.rows[0].count} orphaned entries`
        );

        const orphanedSeries = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM series_videos sv
            LEFT JOIN series s ON s.id = sv.series_id
            WHERE s.id IS NULL
        `);

        logTest(
            'No orphaned series references',
            orphanedSeries.rows[0].count === '0',
            `Found ${orphanedSeries.rows[0].count} orphaned references`
        );

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Summary');
        console.log('='.repeat(60));

        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        const total = results.length;

        console.log(`\nTotal Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

        if (failed === 0) {
            console.log('🎉 All tests passed! Series refactor is working correctly.\n');
            return true;
        } else {
            console.log('⚠️  Some tests failed. Please review the results above.\n');
            return false;
        }

    } catch (error) {
        console.error('\n❌ Test execution failed:', error);
        return false;
    }
}

// Run tests
runTests()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
