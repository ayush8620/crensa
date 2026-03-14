#!/usr/bin/env tsx

/**
 * Database Backup Script
 * 
 * Creates a backup of the database before migration
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

async function backupDatabase() {
    console.log('🔒 Starting Database Backup...\n');
    console.log('=' .repeat(60));

    try {
        // Get database URL from environment
        const databaseUrl = process.env.DATABASE_URL;
        
        if (!databaseUrl) {
            throw new Error('DATABASE_URL not found in environment variables');
        }

        // Create backups directory if it doesn't exist
        const backupsDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
            console.log('✅ Created backups directory\n');
        }

        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                         new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const backupFile = path.join(backupsDir, `backup_${timestamp}.sql`);

        console.log('📋 Backup Information:');
        console.log(`  - Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'Unknown'}`);
        console.log(`  - Backup file: ${backupFile}`);
        console.log(`  - Timestamp: ${new Date().toLocaleString()}\n`);

        // For Neon/PostgreSQL, we'll use pg_dump
        console.log('⏳ Creating backup (this may take a moment)...\n');

        // Extract connection details from DATABASE_URL
        const url = new URL(databaseUrl);
        const host = url.hostname;
        const port = url.port || '5432';
        const database = url.pathname.slice(1).split('?')[0];
        const username = url.username;
        const password = url.password;

        // Set PGPASSWORD environment variable for pg_dump
        const env = {
            ...process.env,
            PGPASSWORD: password
        };

        // Run pg_dump
        const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${backupFile}"`;
        
        console.log('🔄 Running pg_dump...');
        await execAsync(command, { env, maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer

        // Verify backup file was created
        if (fs.existsSync(backupFile)) {
            const stats = fs.statSync(backupFile);
            const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
            
            console.log('\n✅ Backup completed successfully!');
            console.log(`  - File size: ${fileSizeMB} MB`);
            console.log(`  - Location: ${backupFile}\n`);

            // Show backup file info
            console.log('📊 Backup Statistics:');
            console.log(`  - Created: ${stats.birthtime.toLocaleString()}`);
            console.log(`  - Size: ${stats.size.toLocaleString()} bytes\n`);

            // List all backups
            const backupFiles = fs.readdirSync(backupsDir)
                .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
                .sort()
                .reverse();

            if (backupFiles.length > 1) {
                console.log('📁 Previous Backups:');
                backupFiles.slice(1, 6).forEach(file => {
                    const filePath = path.join(backupsDir, file);
                    const fileStats = fs.statSync(filePath);
                    const sizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
                    console.log(`  - ${file} (${sizeMB} MB)`);
                });
                if (backupFiles.length > 6) {
                    console.log(`  ... and ${backupFiles.length - 6} more`);
                }
                console.log();
            }

            console.log('=' .repeat(60));
            console.log('✨ Backup process completed successfully!\n');
            console.log('💡 To restore this backup:');
            console.log(`   psql $DATABASE_URL < "${backupFile}"\n`);
            console.log('🚀 You can now proceed with the migration:');
            console.log('   npm run migrate:series-refactor\n');

            return backupFile;
        } else {
            throw new Error('Backup file was not created');
        }

    } catch (error) {
        console.error('\n❌ Backup failed:', error);
        
        if (error instanceof Error) {
            if (error.message.includes('pg_dump')) {
                console.error('\n⚠️  pg_dump not found. Please install PostgreSQL client tools:');
                console.error('   - Windows: https://www.postgresql.org/download/windows/');
                console.error('   - Mac: brew install postgresql');
                console.error('   - Linux: sudo apt-get install postgresql-client\n');
            } else if (error.message.includes('PGPASSWORD')) {
                console.error('\n⚠️  Database connection failed. Please check your DATABASE_URL\n');
            }
        }

        console.error('💡 Alternative backup method:');
        console.error('   1. Log into your Neon dashboard');
        console.error('   2. Go to your project');
        console.error('   3. Use the "Backup" feature in the UI\n');

        process.exit(1);
    }
}

// Run backup
backupDatabase()
    .then((backupFile) => {
        console.log('🎉 Backup completed successfully!');
        console.log(`📁 Backup saved to: ${backupFile}\n`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
