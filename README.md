# Inkwell – MERN Blog (JWT auth)

Register, log in, write, edit, delete and read posts.
Stack: MongoDB + Express + React (CDN, plain HTML/CSS/JS) + Node + JWT.

## Run locally
```bash
npm install
cp .env.example .env     # set JWT_SECRET and MONGO_URI
npm start                # http://localhost:5000
```

## Deploy free on Vercel (public)
1. **Database:** create a free cluster at https://www.mongodb.com/atlas
   - Database Access: add a user (username + password)
   - Network Access: add IP `0.0.0.0/0` (required for Vercel)
   - Connect > Drivers: copy the connection string, put your password in it and add a db name,
     e.g. `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/blog_mern`
2. **GitHub:** push this folder to a new GitHub repository.
3. **Vercel:** go to https://vercel.com > Add New > Project > import the repo.
   - If prompted for a Root Directory, select the `blog-mern` folder (the folder containing `package.json` and `vercel.json`).
   - Framework preset: **Other**.
   - Leave the Build Command empty. The included `vercel.json` publishes `public/` as the static output and rewrites `/api/*` requests to the Express serverless function in `api/index.js`.
   - Environment Variables:
     - `MONGO_URI` = your Atlas string
     - `JWT_SECRET` = a long random string
     - `JWT_EXPIRES_IN` = `7d`
4. Click **Deploy**. You get a public URL like `https://your-blog.vercel.app`.

   **Important:** Add `MONGO_URI` and `JWT_SECRET` in Vercel → Project → Settings → Environment Variables for Production (and Preview/Development if needed), then redeploy. Do not upload your `.env` file or commit real credentials.

## Structure
```
app.js / server.js   Express app (server.js = local entry)
api/index.js         Vercel serverless entry
db.js                Cached MongoDB connection
models/ routes/ middleware/
public/              index.html, css/style.css, js/api.js, js/app.js
vercel.json          Routes /api/* to the serverless function
```

## API
POST /api/auth/register, POST /api/auth/login, GET /api/auth/me,
GET /api/posts?search=, GET /api/posts/mine, GET /api/posts/:id,
POST /api/posts, PUT /api/posts/:id, DELETE /api/posts/:id
(send `Authorization: Bearer <token>` for protected routes)
