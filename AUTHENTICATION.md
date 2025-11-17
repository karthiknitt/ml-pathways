# Authentication Setup Guide

ML Pathways now uses **BetterAuth** for secure user authentication. All API endpoints are protected and require users to be signed in.

## 🔐 How Authentication Works

### Session Management
- Uses BetterAuth's session-based authentication
- Sessions are stored in the database
- API routes validate sessions using `getSession(request)`
- User data is automatically scoped to the authenticated user

### User Flow
```
1. User visits /signup → Creates account
2. User visits /login → Signs in
3. BetterAuth creates session → Stores in DB
4. User creates experiments → Associated with their user ID
5. User views experiments → Only sees their own data
```

## 📝 Getting Started

### 1. Set Up Environment Variables

Your `.env` file should have:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host/database

# Authentication (REQUIRED)
BETTER_AUTH_SECRET=generate_a_random_secret_here
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# AI Provider (at least one REQUIRED)
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
# OR
GOOGLE_API_KEY=...

AI_PROVIDER=claude  # or openai, gemini
```

**Generate BETTER_AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Run Database Migrations

```bash
npm run db:push
```

This creates:
- `user` table - User accounts
- `session` table - Active sessions
- `account` table - OAuth accounts (for social login)
- `experiments` table - User experiments
- `datasets` table - User datasets
- And more...

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Create Your Account

1. Go to http://localhost:3000/signup
2. Enter email and password
3. Click "Sign Up"
4. You'll be automatically signed in

### 5. Start Using the App!

Once signed in, you can:
- ✅ Create experiments from /problems
- ✅ Upload datasets to /datasets/upload
- ✅ Chat with AI in the workspace
- ✅ Generate and execute code
- ✅ View your experiments and datasets

## 🔒 Protected Routes

### API Routes (All require authentication)

| Route | Method | Auth Required | Ownership Check |
|-------|--------|---------------|-----------------|
| `/api/experiments` | GET | ✅ | Returns only user's experiments |
| `/api/experiments` | POST | ✅ | Creates experiment for current user |
| `/api/experiments/[id]` | GET | ✅ | Verifies user owns experiment |
| `/api/experiments/[id]` | PATCH | ✅ | Verifies user owns experiment |
| `/api/experiments/[id]` | DELETE | ✅ | Verifies user owns experiment |
| `/api/datasets` | GET | ✅ | Returns only user's datasets |
| `/api/datasets` | POST | ✅ | Creates dataset for current user |

### Response Codes

- `200 OK` - Success
- `401 Unauthorized` - Not signed in
- `403 Forbidden` - Signed in but don't own the resource
- `404 Not Found` - Resource doesn't exist
- `503 Service Unavailable` - Database not configured

## 👤 User Management

### Current User Info

In your client components, use BetterAuth's hooks:

```tsx
import { useSession } from "@/lib/auth-client";

function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;

  if (!session) {
    // Not signed in - redirect to login
    return <Navigate to="/login" />;
  }

  const { user } = session;
  // user.id, user.email, user.name available

  return <div>Hello, {user.name}!</div>;
}
```

### Sign Out

```tsx
import { signOut } from "@/lib/auth-client";

function SignOutButton() {
  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return <button onClick={handleSignOut}>Sign Out</button>;
}
```

## 🔧 Troubleshooting

### "Unauthorized" error when creating experiments

**Problem:** API returns 401 Unauthorized

**Solution:**
1. Make sure you're signed in at /login
2. Check browser DevTools → Application → Cookies
3. Should see `better-auth.session_token` cookie
4. If missing, sign in again

### Experiments not appearing

**Problem:** Dashboard/experiments page shows no data

**Possible causes:**
1. **Not signed in** - Go to /login
2. **Using different account** - Each user only sees their own data
3. **Database not migrated** - Run `npm run db:push`

### Session expires

**Default:** Sessions expire after 7 days of inactivity

**To change:** Update `src/lib/auth.ts`:
```ts
betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
  // ... other config
})
```

## 🚀 Optional: Social Login

### Enable GitHub OAuth

1. Create GitHub OAuth App at https://github.com/settings/developers
2. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Add to `.env`:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```
4. Restart server
5. "Sign in with GitHub" button will appear on login page

### Enable Google OAuth

1. Create OAuth client at https://console.cloud.google.com/apis/credentials
2. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
4. Restart server
5. "Sign in with Google" button will appear on login page

## 📚 API Reference

### getSession(request)

Get the current authenticated user in API routes:

```ts
import { getSession } from "@/lib/get-session";

export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const email = session.user.email;
  const name = session.user.name;

  // Use userId to query database...
}
```

### requireAuth(request)

Throws if not authenticated (shorthand):

```ts
import { requireAuth } from "@/lib/get-session";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    // userId is guaranteed to exist
  } catch (error) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
}
```

## 🎯 Best Practices

1. **Never bypass authentication** - Don't remove auth checks from API routes
2. **Verify ownership** - Always check user owns a resource before modifying it
3. **Use sessions, not tokens** - BetterAuth handles session management
4. **Logout on sensitive actions** - Require re-auth for critical operations
5. **Don't expose user IDs** - Use session.user.id server-side only

## 📖 Further Reading

- [BetterAuth Documentation](https://www.better-auth.com/docs)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Database Session Storage](https://www.better-auth.com/docs/concepts/session)
