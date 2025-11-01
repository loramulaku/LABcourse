# 🚀 Quick Start - Database Migration & Seeders

## ⚡ The Fastest Way

### Run Everything at Once:

```batch
npm run migrate
```

**This single command does:**
1. ✅ Runs all database migrations
2. ✅ Runs all database seeders
3. ✅ Sets up your database completely

---

## 📝 All Available Commands

### One-Command Setup

| Command | What It Does |
|---------|--------------|
| `npm run migrate` | **Migrations + Seeders** (recommended) |

### Individual Commands

| Command | What It Does |
|---------|--------------|
| `npm run seed` | Run only seeders |
| `npm run migrate:undo` | Undo last migration |
| `npm run seed:undo` | Undo all seeders |

### Manual Commands (if needed)

| Command | What It Does |
|---------|--------------|
| `npx sequelize-cli db:migrate` | Run only migrations |
| `npx sequelize-cli db:seed:all` | Run only seeders |
| `run-migrations.bat` | Batch file (migrations + seeders) |

---

## 🎯 Common Workflows

### First Time Setup

```batch
cd c:\Lora\LABcourse\backend
npm install
npm run migrate
npm start
```

### After Pulling New Code

```batch
cd c:\Lora\LABcourse\backend
npm run migrate
npm start
```

### Reset Development Database

```batch
npm run seed:undo
npm run migrate:undo
npm run migrate
```

---

## ✅ How to Verify It Worked

After running `npm run migrate`, you should see:

```
Sequelize CLI [Node: xx.x.x, CLI: x.x.x, ORM: x.x.x]

== 20251101_add_specializations_to_doctors: migrating =======
== 20251101_add_specializations_to_doctors: migrated (0.123s)

== 20251101_add_department_id_to_doctors: migrating =======
== 20251101_add_department_id_to_doctors: migrated (0.234s)

== 20251031_seed_departments: seeding =======
== 20251031_seed_departments: seeded (0.045s)
```

✅ **Success!** Your database is ready.

---

## ⚠️ Common Issues

### "No seeders executed"
- **Cause**: Seeders already ran before
- **Solution**: This is fine! Seeders only run once
- **To re-run**: Use `npm run seed:undo` then `npm run seed`

### "Migration has already been executed"
- **Cause**: Migrations already applied
- **Solution**: This is fine! Migrations only run once
- **To re-run**: Use `npm run migrate:undo` then `npm run migrate`

### "Cannot find module 'sequelize-cli'"
- **Solution**: Run `npm install` first

---

## 📚 Need More Details?

See `DATABASE-SETUP.md` for comprehensive documentation on:
- Creating new migrations
- Creating new seeders
- Advanced troubleshooting
- Best practices

---

## 💡 Pro Tip

**Bookmark this command:**
```batch
npm run migrate
```

It's all you need for 99% of database setup tasks! 🎉
