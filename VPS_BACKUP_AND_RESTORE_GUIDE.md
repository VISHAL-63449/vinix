# Vinix Platform - Backup & VPS Migration Guide

This guide explains how to download all student and database records from your Vinix website and how to easily restore or migrate the data when you purchase a VPS (Virtual Private Server).

---

## 1. How to Download Your Data (Anytime)

1. Open the Admin Portal: `http://localhost:5173/admin` or `https://vinix.online/admin`
2. In the left sidebar under **SYSTEM**, click **Backup & Restore**.
3. You have 3 instant options:
   - **Database (SQL)**: Generates a complete PostgreSQL `.sql` dump with all 11 database tables, schemas, and records.
   - **Students Data (.JSON or .CSV)**: Exports all 277+ registered students, applications, domain enrollments, internship progress, offer letters, and certificate IDs.
   - **Full Backup (.JSON)**: Comprehensive system package containing all data tables, schema metadata, and audit logs.
4. Clicking any option automatically downloads the file to your computer and records it in your **Backup History** list.

---

## 2. Restoring on Localhost or via Web Admin UI

1. Go to **Backup & Restore** in the Admin Portal.
2. Under **Restore from Upload** (right column), click **Choose File**.
3. Select your `.json` or `.sql` backup file.
4. Click **Start Restore to Database**.
5. The live progress bar shows tables being restored in safe dependency order (`profiles` → `domains` → `internships` → `tasks` → `enrollments` → `task_progress` → `offer_letters` → `certificates`).
6. All records are restored using safe **Upsert** (existing records are updated, new records are added, no data is lost or duplicated).

---

## 3. How to Restore on Your Future VPS

When you buy a VPS (Ubuntu, Debian, or AlmaLinux):

### Method A: Web UI Upload (Easiest)
1. Deploy your Vinix frontend & backend on your VPS.
2. Open `/admin` → **Backup & Restore** in your browser.
3. Click **Choose File** under **Restore from Upload** and pick your downloaded `.json` backup file.
4. Click **Start Restore to Database**. All records will be imported into your VPS database automatically!

### Method B: Standalone Node CLI Script
On your VPS terminal, run the included restore script:
```bash
# 1. Transfer your backup file to the VPS (via SCP, SFTP, or Git)
# 2. Run the restore command:
node scripts/vps-restore.js /path/to/vinix_full_backup.json
```

### Method C: Direct PostgreSQL Command Line (`psql`)
If you downloaded the `.sql` format backup:
```bash
# Run the SQL file directly against your PostgreSQL database on the VPS:
psql -U postgres -d vinix_db -f vinix_database_backup_*.sql
```

---

## 4. Tables Included in Every Backup

- `profiles`: All user and student accounts (names, emails, phones, college, branch, year).
- `internship_enrollments`: All student enrollment records, progress %, status, and joined dates.
- `internship_applications`: All internship applications and student submissions.
- `task_progress`: All 1,800+ task submissions, GitHub repository URLs, and LinkedIn proof links.
- `internship_tasks`: All internship task specifications.
- `offer_letters`: All student offer letter numbers, issued dates, and verification data.
- `certificates`: All student certificate verification IDs and issue dates.
- `domains`: All 20 internship domain tracks.
- `internships`: All 34 internship listings.
- `reviews`: Student testimonials and platform reviews.
