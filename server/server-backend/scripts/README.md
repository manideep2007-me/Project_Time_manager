# Database Scripts

## ⚠️ IMPORTANT: Data Safety

**NEVER run scripts that delete data without understanding what they do!**

## Safe Scripts (Recommended)

### `safe-seed.js`
- ✅ **SAFE** - Only creates admin user if it doesn't exist
- ✅ **NON-DESTRUCTIVE** - Never deletes existing data
- ✅ **Use this for**: Initial setup or adding admin user

```bash
node scripts/safe-seed.js
```

### `restore-all-projects.js`
- ✅ **SAFE** - Restores sample data (21 projects, 6 clients)
- ✅ **NON-DESTRUCTIVE** - Only adds data, doesn't delete
- ✅ **Use this for**: Getting sample data for testing

```bash
node scripts/restore-all-projects.js
```

## Dangerous Scripts (Use with Caution)

### `seed.js`
- ⚠️ **DANGEROUS** - Deletes ALL existing data
- ⚠️ **DESTRUCTIVE** - Will wipe your database
- ⚠️ **Use only for**: Fresh database setup
- ⚠️ **Has 5-second warning** - Press Ctrl+C to cancel

```bash
node scripts/seed.js  # ⚠️ DANGEROUS!
```

## Other Scripts

- `setup-database.js` - Creates database schema (safe)
- `list-all-projects.js` - Lists all projects (safe)
- `add-more-team-members.js` - Adds employees (safe)

## Best Practices

1. **Always backup** your database before running destructive scripts
2. **Use safe-seed.js** for initial setup
3. **Use restore-all-projects.js** for sample data
4. **Never run seed.js** on production data
5. **Check what a script does** before running it

## Recovery

If you accidentally deleted data:
1. Check if you have database backups
2. Run `restore-all-projects.js` to get sample data back
3. Contact your database administrator for data recovery
