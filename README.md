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
