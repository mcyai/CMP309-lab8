# CMP309 - Assignment 8: Information Server

A small Node.js and Express 5 server for a made-up study programme. It serves a web page, offers a few API routes (text, JSON, errors, redirects), logs every request and counts the requests it has served.

## How to install and run

Requirements: Node.js (LTS) and npm.

```bash
git clone <repository-url>
cd <repository-folder>
npm install
npm start
```

Then open <http://localhost:3000>.

- `npm start` runs the server with `node server.js`.
- `npm run dev` runs it with `node --watch server.js` and restarts it when a file changes (built into Node, no extra package).
- The port comes from the `PORT` environment variable, with `3000` as a fallback. For example, in PowerShell: `$env:PORT = 4000; npm start`. In Bash: `PORT=4000 npm start`.

## File organization

```
/
 ├─ public/
 │   ├─ index.html   page with one button per API route
 │   ├─ styles.css   styles
 │   └─ app.js       fetch() calls and response display
 ├─ server.js        Express app, middleware, routes, 404 fallback
 ├─ package.json     "type": "module", scripts, express dependency
 ├─ package-lock.json
 ├─ .gitignore       node_modules/ and .env
 └─ README.md
```

## Routes

| Method and path | Behaviour |
|---|---|
| `GET /` | Serves `public/index.html` (through `express.static`) |
| `GET /hello` | Plain text greeting |
| `GET /robots.txt` | Plain text file body (`text/plain`) |
| `GET /old-page` | Redirect (302) to `/hello` |
| `GET /api/courses` | JSON array of courses (`id`, `title`, `credits`) |
| `GET /api/status` | JSON `{ status, nodeVersion, uptimeSeconds }` from the running process |
| `GET /api/headers` | JSON echo of the `User-Agent` and `Accept` headers |
| `POST /api/subscribe` | 201 with `{ "subscribed": true }` |
| `GET /api/admin` | 403 with `{ "error": "Forbidden" }` |
| `GET /api/stats` | JSON `{ "requestsServed": <number> }` |
| anything else | 404 fallback (JSON for `/api...`, text otherwise) |

## Middleware

Two middleware functions are registered in `server.js` **before** the static files and the routes. Both call `next()`.

1. **Request logger** prints one line per request: timestamp, method and URL.
2. **Request counter** increases `requestsServed` by one. `GET /api/stats` returns it.

**Which requests are counted?** Every request that reaches the server is counted: API routes, `/hello`, static files (`/`, `styles.css`, `app.js`, the browser's automatic `/favicon.ico`), redirects, 404 responses, and the `/api/stats` request itself. The counter runs before any route, so it cannot know yet whether the request will succeed. I chose "requests received" because it is the simplest definition and does not depend on what the response turns out to be.

**Why this order?** The middleware must come first. `express.static` sends the file and stops without calling `next()` when it finds one, so a counter or logger placed after it would never see requests for static files. The 404 fallback is the opposite: it must come last, so it only handles what nothing else answered. The logger is first so that a request is logged even if something later fails.

## Testing evidence (`curl --include`)

The commands below were run against the server started with `npm start` (the server was actually started on another port while capturing the output, so `localhost:3000` is shown for clarity; the response headers are unchanged).

**Successful JSON response**

```
$ curl --include http://localhost:3000/api/courses
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 200
ETag: W/"c8-CaXTGbrFMo/iGxBRWOCuvcxhakI"
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":1,"title":"Web Programming","credits":6},{"id":2,"title":"Databases","credits":5},{"id":3,"title":"Algorithms and Data Structures","credits":6},{"id":4,"title":"Computer Networks","credits":4}]
```

**201 response**

```
$ curl --include -X POST http://localhost:3000/api/subscribe
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 19
ETag: W/"13-oWAPIqDXuocNexKhPYW9ayyk98c"
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"subscribed":true}
```

**403 response**

```
$ curl --include http://localhost:3000/api/admin
HTTP/1.1 403 Forbidden
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-TLNzmZqKxaTuFdX/dVWWPBu44/c"
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Forbidden"}
```

**Redirect**

```
$ curl --include http://localhost:3000/old-page
HTTP/1.1 302 Found
X-Powered-By: Express
Location: /hello
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 28
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Found. Redirecting to /hello
```

**404 on an `/api` path**

```
$ curl --include http://localhost:3000/api/does-not-exist
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}
```

**404 on a non-API path**

```
$ curl --include http://localhost:3000/no-such-page
HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 20
ETag: W/"14-uqvetqrE8oeY4r2Xn8/CTahXnYE"
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

404 - Page not found
```

**Plain text (`/hello`)**

```
$ curl --include http://localhost:3000/hello
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 25
ETag: W/"19-AG6Mi/8ZP45t+8YtwiU0WIlVtXg"
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Hello from cagri's server
```

**Plain text file (`/robots.txt`)**

```
$ curl --include http://localhost:3000/robots.txt
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8
Content-Length: 35
ETag: W/"23-AFlBEdGVlEiTRhyly9yF5dDLJM0"
Date: Tue, 17 Nov 2026 11:02:03 GMT
Connection: keep-alive
Keep-Alive: timeout=5

User-agent: *
Disallow: /api/admin
```

## Reasoning questions

**1. Route order.** I moved the 404 fallback to the top of `server.js`, right after the middleware. Every request, including `/hello`, `/api/courses` and `/`, then returned 404. Express runs handlers in the order they were registered, and the fallback matches every request and sends a response, so the routes below it were never reached.

**2. Middleware.** I removed `next()` from the logger. The server printed the log line for the request, but nothing else happened: the request never moved on to the counter or to any route, so no response was sent. With `curl` the request hung until I stopped it after 4 seconds (curl exit code 28, timeout). A browser tab waits the same way, because the server neither answers nor closes the connection.

**3. Status codes.** `POST /api/subscribe` creates something new, and `201 Created` says exactly that, while `200 OK` only says the request worked. Status codes are part of the protocol: browsers, `fetch` (`response.ok`), caches, search engines and monitoring tools read the code, not the body. A missing page with `200` and an error message would tell all of them that everything is fine.

**4. Configuration.** Hosting platforms and other machines decide the port, and `3000` may already be used by another program. Reading `process.env.PORT` lets the same code run everywhere without editing it, and the `3000` fallback keeps local development simple.

**5. Dependencies.** `node_modules` contains hundreds of files that anyone can regenerate, so committing it makes the repository big and noisy. `package.json` and `package-lock.json` already describe the exact packages and versions. After cloning, a teammate runs `npm install` and then `npm start`.

**6. Same origin.** If the page is opened directly from disk, its address is `file:///...` and not `http://localhost:3000`, so the relative URL `/api/courses` would point to `file:///api/courses` and fail. Using the full address `http://localhost:3000/api/courses` instead would be a cross-origin request, which the browser blocks because of the **same-origin policy** (a server can allow it with CORS headers, which this assignment does not use).

## Self-study notes

- **Node version and running time.** The Node documentation for the `process` object shows `process.version` (for example `v22.20.0`) and `process.uptime()`, which returns the seconds since the process started as a decimal number. I use `Math.floor(process.uptime())` to get whole seconds for `uptimeSeconds`.
- **Content type for plain text.** `res.send` with a string sets `text/html`. In the first version of `/hello` the header came out as `text/html`, which I noticed in the `curl` output. Express documents `res.type('text/plain')` (it also accepts values like `'json'` or `'html'`), so I chain `res.type('text/plain').send(...)` for `/hello`, `/robots.txt` and the text 404.
- **Pretty JSON in the page.** `JSON.stringify(value, null, 2)` formats JSON with 2-space indentation. In `app.js` I first read the body as text, try `JSON.parse` and format it, and show it unchanged if it is not JSON. The result is written with `textContent` into a `<pre>` element.
- **Absolute path for static files.** `express.static('public')` depends on the folder the server is started from. I use `path.join(import.meta.dirname, 'public')`, so it works from any folder (`import.meta.dirname` is available in ES modules in current Node versions, replacing `__dirname`).
- **Express 5 fallback.** Express 5 does not accept `app.get('*', ...)`. A handler registered with `app.use(...)` without a path, placed after all routes, handles every unmatched request.

## Challenges I faced

- `/hello` returned `text/html` at first because `res.send` guesses the type from the value. I found it by reading the headers with `curl --include` and fixed it with `res.type('text/plain')`.
- Express 5 changed wildcard routing, so the Express 4 style `app.get('*')` for the 404 fallback does not work. I used a path-less `app.use` registered last.
- Understanding why the middleware order matters: `express.static` ends the request when it finds a file, so the logger and counter had to be registered before it.
- The experiments (fallback at the top, logger without `next()`) were done on temporary copies of `server.js`, so the final server stays unchanged.
