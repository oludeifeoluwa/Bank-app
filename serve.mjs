import { spawn } from 'node:child_process';
import { createApp } from './server.mjs';

// On a hosting platform (Render, etc.) PORT is provided and the app must bind
// to 0.0.0.0; locally it stays on 127.0.0.1 for the usual dev experience.
const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const port = Number(process.env.PORT || process.env.HARBORLINE_PORT || 43824);
const apiOnly = process.argv.includes('--api-only');
const app = await createApp({ staticFiles: !apiOnly });

if (process.argv.includes('--owner-code')) {
  try {
    const code = app.locals.issueOwnerCode();
    console.log('\nHarborline owner setup code (valid for 20 minutes):\n\n  ' + code + '\n');
    console.log('Sign in with your private practice profile and enter the code at http://' + host + ':' + port + '/admin.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
} else {
  const server = app.listen(port, host, () => {
    const address = 'http://' + host + ':' + server.address().port + '/';
    console.log((apiOnly ? 'Harborline API' : 'Harborline') + ' is running at ' + address);
    if (!apiOnly && process.platform === 'win32' && process.argv.includes('--open')) {
      const browser = spawn('explorer.exe', [address], { windowsHide: true, stdio: 'ignore' });
      browser.on('error', () => console.log('Open ' + address + ' in your browser.'));
    }
  });
  server.on('error', error => {
    console.error(error.code === 'EADDRINUSE' ? 'Harborline is already open or port ' + port + ' is in use.' : error.message);
    process.exitCode = 1;
  });
}
