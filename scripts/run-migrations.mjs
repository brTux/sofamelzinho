import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.SUPABASE_POSTGRES_URL || process.env.NEON_NEON_DATABASE_URL);

async function runMigrations() {
  try {
    console.log('[v0] Starting database migrations...');
    
    // Read and execute the migration scripts
    const fs = await import('fs');
    const path = await import('path');
    
    // Get the directory of this script
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    
    // Read migration files
    const migration1 = fs.readFileSync(path.join(__dirname, '001_create_tables.sql'), 'utf-8');
    const migration2 = fs.readFileSync(path.join(__dirname, '002_profile_trigger.sql'), 'utf-8');
    
    // Split by semicolon and filter empty statements
    const statements1 = migration1
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const statements2 = migration2
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const allStatements = [...statements1, ...statements2];
    
    console.log(`[v0] Found ${allStatements.length} SQL statements to execute`);
    
    for (let i = 0; i < allStatements.length; i++) {
      const statement = allStatements[i];
      console.log(`[v0] Executing statement ${i + 1}/${allStatements.length}...`);
      try {
        await sql(statement);
        console.log(`[v0] ✓ Statement ${i + 1} completed`);
      } catch (error) {
        // Some statements may fail if they already exist, that's okay
        if (error.message && error.message.includes('already exists')) {
          console.log(`[v0] ⚠ Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`[v0] ✗ Statement ${i + 1} failed:`, error.message);
        }
      }
    }
    
    console.log('[v0] Database migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('[v0] Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
