// Uses the existing configuration without changing any environment file.
import { spawn } from 'node:child_process';
process.loadEnvFile('.env.test.local');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--port', '3200'], {
  stdio: 'inherit', env: process.env,
});
process.on('SIGINT', () => child.kill('SIGINT'));
child.on('exit', code => process.exit(code ?? 0));
