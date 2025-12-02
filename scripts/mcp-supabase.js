import 'dotenv/config';
import { spawn } from 'child_process';
import path from 'path';

// Map VITE_ variables to standard Supabase variables if not present
process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
process.env.SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_KEY (or VITE_ equivalents) in .env file');
    process.exit(1);
}

console.log('Starting Supabase MCP Server...');
console.log(`URL: ${process.env.SUPABASE_URL}`);
console.log('Key: [HIDDEN]');

const mcpProcess = spawn('npx', ['-y', '@modelcontextprotocol/server-supabase'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
});

mcpProcess.on('error', (err) => {
    console.error('Failed to start MCP server:', err);
});

mcpProcess.on('close', (code) => {
    if (code !== 0) {
        console.log(`MCP server exited with code ${code}`);
    }
});
