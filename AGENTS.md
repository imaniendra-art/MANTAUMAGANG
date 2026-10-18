<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🚀 Server Deployment & Auto-Update Protocol (Server Mode)
Whenever the user requests an update, pull, deploy, or sync from GitHub on the server (e.g. commands or phrases like: "pull dari github", "update aplikasi", "update server", "deploy", "tarik update", "sinkronkan", dll):

The agent MUST autonomously execute the following deployment sequence in order:
1. Run `git pull origin main` to pull latest changes from the repository.
2. Run `npm install` to ensure any new dependencies are installed.
3. Run `npm run build` to compile the production build. Verify exit code is 0.
4. Restart the production server process:
   - Try `pm2 restart mantaumagang` or `pm2 restart all`.
   - If PM2 process is not found, launch via `pm2 start npm --name "mantaumagang" -- start`.
5. Perform a quick health check ping (`curl.exe -s -o NUL -w "%{http_code}" http://localhost:3020/`) to verify status 200 OK.
6. Provide a clean summary confirming that the live application is successfully updated and running.

