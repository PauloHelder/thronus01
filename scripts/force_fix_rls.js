import pg from 'pg';
const { Client } = pg;

// Default Supabase local connection string
const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({
    connectionString,
});

async function run() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        const sql = `
      BEGIN;

      -- 1. Discipleship Meetings
      DROP POLICY IF EXISTS "Users can manage discipleship meetings" ON discipleship_meetings;
      DROP POLICY IF EXISTS "Allow all authenticated for meetings" ON discipleship_meetings;
      
      CREATE POLICY "Allow all authenticated for meetings"
      ON discipleship_meetings FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

      -- 2. Discipleship Meeting Attendance
      DROP POLICY IF EXISTS "Users can manage discipleship meeting attendance" ON discipleship_meeting_attendance;
      DROP POLICY IF EXISTS "Debug: Allow all authenticated for attendance" ON discipleship_meeting_attendance;
      DROP POLICY IF EXISTS "Allow all authenticated for attendance" ON discipleship_meeting_attendance;

      CREATE POLICY "Allow all authenticated for attendance"
      ON discipleship_meeting_attendance FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

      COMMIT;
    `;

        console.log('Applying RLS fixes...');
        await client.query(sql);
        console.log('RLS policies updated successfully! You should be able to add meetings now.');
    } catch (err) {
        console.error('Error executing SQL:', err);
        console.log('If the error is "connection refused", make sure Supabase is running locally.');
    } finally {
        await client.end();
    }
}

run();
