# Turso Migration Guide

## Overview

Your application has been successfully migrated from IndexedDB to Turso (distributed SQLite database). This provides better data persistence, cloud sync, and reliability.

## What Changed

### ✅ Completed Migration

1. **New Database Schemas Created**
   - `characters` - Character data and relationships
   - `world_building_projects`, `locations`, `cultures`, `timelines`, `lore_entries`, `research_sources`, `world_maps` - World-building data
   - `chapter_versions`, `branches` - Version control system
   - `publishing_metrics`, `platform_status`, `export_history` - Publishing analytics
   - `analysis_history`, `user_writing_preferences`, `suggestion_feedback`, `writing_goals` - Writing assistant data

2. **New Service Layer**
   - `characterService` - Turso-based character operations
   - `worldBuildingService` - Turso-based world-building operations
   - `versioningService` - Turso-based versioning operations
   - `publishingService` - Turso-based publishing analytics
   - `writingAssistantService` - Turso-based writing assistant operations

3. **Migration Tools**
   - `migration-utility.ts` - Automated data migration from IndexedDB to Turso
   - `MigrationWizard.tsx` - User-friendly migration interface

4. **Updated Services**
   - `characterService.ts` - Now delegates to Turso service layer

## Setup Instructions

### 1. Create a Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create a new database
turso db create novelist-ai

# Get database URL
turso db show novelist-ai --url

# Create auth token
turso db tokens create novelist-ai
```

### 2. Configure Environment Variables

Add to your `.env` or `.env.local`:

```env
VITE_TURSO_DATABASE_URL=libsql://your-database-url.turso.io
VITE_TURSO_AUTH_TOKEN=your-auth-token-here
```

### 3. Run Database Migrations

```bash
# Generate migration files (already done)
npm run db:generate

# Apply migrations to Turso
npm run db:migrate

# Or push schema directly (development only)
npm run db:push
```

### 4. Start the Application

```bash
npm run dev
```

On first launch with Turso configured, users will see the **Migration Wizard** to transfer their IndexedDB data to Turso.

## Database Management

### View Data in Drizzle Studio

```bash
npm run db:studio
```

This opens a web-based database browser at `https://local.drizzle.studio`

### Query Database via Turso CLI

```bash
turso db shell novelist-ai
```

### Backup Database

```bash
turso db backup create novelist-ai
```

## Architecture

### Hybrid Approach

The app now supports both local (IndexedDB) and cloud (Turso) storage:

- **Without Turso config**: Uses IndexedDB (legacy mode)
- **With Turso config**: Uses Turso with automatic migration from IndexedDB

### Service Layer Structure

```
src/lib/database/
├── drizzle.ts              # Drizzle ORM client
├── config.ts               # Database configuration
├── schemas/                # Database schemas
│   ├── characters.ts
│   ├── world-building.ts
│   ├── versioning.ts
│   ├── publishing.ts
│   └── writing-assistant.ts
├── services/               # Service layer
│   ├── character-service.ts
│   ├── world-building-service.ts
│   ├── versioning-service.ts
│   ├── publishing-service.ts
│   └── writing-assistant-service.ts
└── migration-utility.ts    # Migration tools
```

### Feature Services

Feature services (e.g., `src/features/characters/services/characterService.ts`) now act as adapters that delegate to the Turso service layer while maintaining backward compatibility.

## Migration Process

1. **User opens app** with Turso configured
2. **System checks** for existing IndexedDB data
3. **Migration Wizard** appears if data found
4. **User initiates** migration
5. **Data transfers** from IndexedDB to Turso
6. **User confirms** cleanup of old IndexedDB data

## Remaining Tasks

### High Priority

1. **Update Remaining Services** - Complete migration for:
   - `worldBuildingDb.ts` 
   - `versioningService.ts` (feature layer)
   - `publishingAnalyticsService.ts`
   - `writingAssistantDb.ts`
   - `editorService.ts`

2. **Update Tests** - Modify test suites to:
   - Mock Turso database calls
   - Test migration utility
   - Ensure backward compatibility

3. **Add Settings UI** - Create interface to:
   - Configure Turso credentials
   - Test database connection
   - Trigger manual migration
   - View sync status

### Medium Priority

4. **Implement Offline Support** - Handle cases when:
   - Turso is unreachable
   - User is offline
   - Fallback to local cache

5. **Add Sync Indicators** - Show users:
   - Sync status (synced/pending/error)
   - Last sync time
   - Conflict resolution

6. **Performance Optimization**
   - Implement query caching
   - Add connection pooling
   - Optimize batch operations

### Low Priority

7. **Advanced Features**
   - Multi-device sync
   - Conflict resolution UI
   - Real-time collaboration (via Turso edge functions)
   - Data export/import

## Testing

### Manual Testing

1. Create test data in IndexedDB mode
2. Configure Turso credentials
3. Run migration wizard
4. Verify data in Turso via Drizzle Studio
5. Test CRUD operations

### Automated Testing

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e
```

## Troubleshooting

### Migration Fails

- Check Turso credentials are correct
- Verify network connectivity
- Check browser console for errors
- Review logs in `logger` output

### Data Not Syncing

- Ensure Turso config is in localStorage or env
- Check `getDrizzleClient()` returns valid client
- Verify migrations are applied: `npm run db:migrate`

### Performance Issues

- Check network latency to Turso
- Consider enabling query caching
- Use batch operations for bulk inserts

## Security Considerations

- **Auth tokens**: Never commit tokens to git
- **Environment variables**: Use `.env.local` for secrets
- **User data**: All data encrypted in transit (HTTPS)
- **Access control**: Implement row-level security (future)

## Benefits of Turso

✅ **Cloud sync** - Data accessible from multiple devices
✅ **Better reliability** - Distributed SQLite with replication
✅ **Type safety** - Drizzle ORM with TypeScript
✅ **Better queries** - Full SQL capabilities
✅ **Easy backups** - Built-in backup and restore
✅ **Free tier** - 9GB storage, 500 databases

## Resources

- [Turso Documentation](https://docs.turso.tech/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [LibSQL Documentation](https://github.com/libsql/libsql)

## Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/your-repo/issues)
2. Review Turso status page
3. Check browser console for errors
4. Review migration logs
