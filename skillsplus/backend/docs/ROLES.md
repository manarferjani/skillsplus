# Role-Based Access Control in SkillsPlus

SkillsPlus uses a numeric role-based access control system to manage permissions across the application.

## Role Hierarchy

The system uses the following role values:

| Role Value | Role Name     | Description                                 |
|------------|---------------|---------------------------------------------|
| 1          | Admin         | System administrator with full access       |
| 2          | Manager       | Project or team manager with elevated access|
| 3          | Collaborator  | Regular user with standard access           |

## Access Logic

Access is generally controlled based on role hierarchy, where lower numbers have more privileges:

- Role 1 (Admin): Full access to all features and functionality
- Role 2 (Manager): Access to management features and all collaborator features
- Role 3 (Collaborator): Basic access to core application features

## Using Middleware

The authentication system provides several middleware functions to control access based on roles:

### `auth`

Verifies that a user is authenticated with a valid JWT token.

```javascript
// Example usage
app.get('/protected-route', auth, (req, res) => {
  // This route is accessible to any authenticated user
});
```

### `isAdmin`

Checks if the authenticated user has the Admin role (role value 1).

```javascript
// Example usage
app.get('/admin-only', auth, isAdmin, (req, res) => {
  // This route is only accessible to admins (role 1)
});
```

### `isManager`

Checks if the authenticated user has Manager role or higher (role value 1 or 2).

```javascript
// Example usage
app.get('/manager-route', auth, isManager, (req, res) => {
  // This route is accessible to managers and admins (roles 1 and 2)
});
```

### `hasRole`

Generic middleware factory that creates middleware to check if a user's role is at or above a specific level.

```javascript
// Example usage
app.get('/custom-role', auth, hasRole(2), (req, res) => {
  // This route is accessible to users with role 2 or higher
});
```

## Integration with Clerk

When users authenticate through Clerk, they are assigned the default role of Collaborator (3). An administrator can later update their role if needed through the appropriate administrative interface.

## Testing Role Access

The API provides test endpoints to verify role-based access:

- `/api/test/public` - Accessible to everyone
- `/api/test/auth` - Requires authentication (any role)
- `/api/test/manager` - Requires manager or admin (roles 1-2)
- `/api/test/admin` - Requires admin only (role 1) 