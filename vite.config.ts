import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-serverless-emulator',
      configureServer(server: any) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          // Load .env variables into process.env for local API emulation
          try {
            const envPath = path.resolve(dirname, '.env');
            if (fs.existsSync(envPath)) {
              const envContent = fs.readFileSync(envPath, 'utf-8');
              envContent.split('\n').forEach(line => {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
                if (match) {
                  const key = match[1];
                  let val = (match[2] || '').trim();
                  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                  if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
                  process.env[key] = val;
                }
              });
            }
          } catch (e) { }

          if (req.url && (req.url.startsWith('/api/') || req.url.startsWith('/vinix/api/'))) {
            const cleanUrl = req.url.replace('/vinix/api/', '/api/').split('?')[0];
            const functionName = cleanUrl.replace('/api/', '');
            const apiPath = path.resolve(dirname, 'api', `${functionName}.js`);

            if (fs.existsSync(apiPath)) {
              try {
                let body = {};
                if (req.method === 'POST') {
                  const buffers: any[] = [];
                  for await (const chunk of req as any) {
                    buffers.push(chunk);
                  }
                  const rawBody = (globalThis as any).Buffer.concat(buffers).toString();
                  if (rawBody) {
                    try {
                      body = JSON.parse(rawBody);
                    } catch (e) {
                      body = {};
                    }
                  }
                }

                const apiReq = Object.assign(req, { body });
                const apiRes = Object.assign(res, {
                  status(code: number) {
                    res.statusCode = code;
                    return apiRes;
                  },
                  json(data: any) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return apiRes;
                  },
                  setHeader(name: string, val: string) {
                    res.setHeader(name, val);
                    return apiRes;
                  },
                  end(data: any) {
                    res.end(data);
                    return apiRes;
                  }
                });

                // Dynamic import with cache-busting to bypass node ESM module caching in dev
                const { default: handler } = await import(`${apiPath}?t=${Date.now()}`);
                await handler(apiReq, apiRes);
                return;
              } catch (err: any) {
                (globalThis as any).console.error(`Status 500 in simulated API /api/${functionName}:`, err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Emulator Error', message: err.message }));
                return;
              }
            }
          }
          next();
        });
      }
    }
  ],
  base: (globalThis as any).process?.env?.VERCEL ? '/' : '/vinix/',
})


