import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const client = new Client({
    connectionString,
});

async function run() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        const sql = `
      BEGIN;

      -- Teaching Lessons
      DROP POLICY IF EXISTS "Users can manage teaching lessons" ON teaching_lessons;
      CREATE POLICY "Allow authenticated manage teaching lessons"
      ON teaching_lessons FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

      -- Teaching Lesson Attendance
      DROP POLICY IF EXISTS "Users can manage teaching lesson attendance" ON teaching_lesson_attendance;
      CREATE POLICY "Allow authenticated manage teaching lesson attendance"
      ON teaching_lesson_attendance FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
      
      -- Teaching Class Students
      DROP POLICY IF EXISTS "Users can manage teaching class students" ON teaching_class_students;
      CREATE POLICY "Allow authenticated manage teaching class students"
      ON teaching_class_students FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

      COMMIT;
    `;
        console.log('Applying Teaching RLS fixes...');
        await client.query(sql);
        console.log('Success.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
