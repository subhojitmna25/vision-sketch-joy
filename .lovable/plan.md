

# Admin Dashboard: User Management and Role Assignment

## Overview

Add a new **Admin** section to the dashboard that lets admins view all registered users and manage their roles (admin, moderator, user). Access is restricted to users with the `admin` role using the existing `has_role` database function.

## Database Changes

1. **New `admin_list_users` database function** (security definer) — returns all profiles joined with their roles. This bypasses RLS so admins can see all users without per-row policies on profiles for other users.

2. **New `admin_set_role` database function** (security definer) — allows an admin to insert/update/delete a role for a given user. Validates the caller has the `admin` role internally.

3. **Seed your test user as admin** — insert a row into `user_roles` for `testuser@example.com` with role `admin` so you can access the admin dashboard.

## Frontend Changes

1. **New page: `src/pages/dashboard/AdminPage.tsx`**
   - Fetches all users via the `admin_list_users` RPC
   - Displays a table with columns: Name, Email, Current Role, Created At
   - Each row has a role selector (dropdown) to change role between `admin`, `moderator`, `user`, or remove role
   - Calls `admin_set_role` RPC on change
   - Shows a guard message if the current user is not an admin

2. **Update `src/App.tsx`** — add route `/dashboard/admin` inside the dashboard layout

3. **Update `src/components/AppSidebar.tsx`** — add "Admin" menu item (with Shield icon), conditionally shown only when the user has the `admin` role (checked via an RPC call or query on `user_roles`)

## Technical Details

```text
Browser → AdminPage
  ├── useQuery: supabase.rpc('admin_list_users')
  │     └── Returns: [{user_id, full_name, email, role, created_at}]
  ├── Role change → useMutation: supabase.rpc('admin_set_role', {target_user_id, new_role})
  └── Admin check: useQuery on user_roles where user_id = current user
```

**Security**: Both RPC functions use `SECURITY DEFINER` and internally verify the caller has `admin` role via `has_role(auth.uid(), 'admin')`, so non-admins cannot call them even directly.

## Steps

1. Create migration with `admin_list_users` and `admin_set_role` functions
2. Insert admin role for the test user via data insert
3. Create `AdminPage.tsx` with user table and role management
4. Add route and sidebar entry (admin-only visibility)

