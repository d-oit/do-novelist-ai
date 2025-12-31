# Authorization

Role-based access control and permission management.

## RBAC Roles

### Role Definitions

```typescript
export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  CONTRIBUTOR = 'contributor',
}

export interface RolePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
```

### Permission Matrix

```typescript
export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  [Role.ADMIN]: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: true,
  },
  [Role.EDITOR]: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
  },
  [Role.VIEWER]: {
    canCreate: false,
    canRead: true,
    canUpdate: false,
    canDelete: false,
  },
  [Role.CONTRIBUTOR]: {
    canCreate: true,
    canRead: true,
    canUpdate: true,
    canDelete: false,
  },
};
```

## Authorization Service

```typescript
export class AuthorizationService {
  constructor(
    private userRepository: UserRepository,
    private projectRepository: ProjectRepository,
  ) {}

  hasPermission(
    user: User,
    role: Role,
    permission: keyof RolePermissions,
  ): boolean {
    return ROLE_PERMISSIONS[role]?.[permission] || false;
  }

  canAccessProject(user: User, projectId: string): boolean {
    return this.hasPermission(user, Role.EDITOR, 'canUpdate');
  }

  canAccessAllProjects(user: User): boolean {
    return this.hasPermission(user, Role.ADMIN, 'canRead');
  }

  canDeleteProject(user: User, projectId: string): boolean {
    return this.hasPermission(user, Role.ADMIN, 'canDelete');
  }
}
```

## Route Protection

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = tokenService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
}

export function requireRole(role: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    return (req, res, next) => {
      const user = req.user as User;

      if (!authService.hasPermission(user, role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    });
  };
}
```

## Project-Based Access Control

```typescript
export class ProjectAccessService {
  async checkAccess(
    userId: string,
    projectId: string,
    requiredRole: Role.EDITOR,
  ): Promise<boolean> {
    const project = await projectRepository.findById(projectId);
    if (!project) return false;

    if (project.userId !== userId) {
      const user = await userRepository.findById(project.userId);
      const hasAccess = authzService.hasRole(user, requiredRole);
      return hasAccess;
    }

    if (!hasAccess) {
      throw new AuthorizationError('User does not have required permissions');
    }

    return true;
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
```

## Best Practices

### DO

```typescript
// ✅ Use RBAC for complex permissions
const hasAdminAccess = await authorizationService.hasPermission(
  user,
  Role.ADMIN,
);

// ✅ Check permissions before resource access
if (!hasAccess) {
  throw new Error('Insufficient permissions');
}

// ✅ Use middleware for route protection
app.get('/admin', requireAuth, requireRole(Role.ADMIN));

// ✅ Use hierarchical roles
const canEdit = hasRole(user, Role.EDITOR);
const canDelete = hasRole(user, Role.ADMIN);

// ✅ Validate user on every request
const isValid = await sessionService.validateSession(req.cookies.sessionId);
```

### DON'T

```typescript
// ✗ Check roles only on protected routes
app.get('/admin', requireAuth); // Bad! No auth check on public route

// ✗ Allow direct database access in application layer
const project = await projectRepository.findById(id); // Bad! Should use service

// ✗ Hardcode permissions in components
if (user.role === 'admin') {
  return <AdminPanel />; // Bad! Use RBAC check
}

// ✗ Skip authorization in development
app.post('/admin', (req, res) => { ... }); // Bad! No auth check in dev
```

## Permission Checking

### Check Multiple Roles

```typescript
export function checkPermissions(user: User, requiredRoles: Role[]): {
  const userRoles = await userRoleService.getUserRoles(user.id);

  const hasAllRoles = requiredRoles.every(role =>
    userRoles.includes(role)
  );

  return hasAllRoles;
}
```

### Granular Permissions

```typescript
export class GranularPermission {
  constructor(
    public readonly resource: string,
    public readonly action: string,
    public readonly allowedRoles: Role[],
  ) {}

  isAllowed(user: User): boolean {
    return this.allowedRoles.some(role => user.roles?.includes(role));
  }
}

// Usage
const canEditChapter = new GranularPermission('chapter', 'edit', [
  Role.EDITOR,
  Role.AUTHOR,
]);

if (canEditChapter.isAllowed(user)) {
  // Allow chapter edit
}
```

---

Implement role-based access control with granular permissions for flexibility.
