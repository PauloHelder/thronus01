# Task: Implement Comprehensive Asset Management System

The user wants a complete asset management system for the church. This includes tracking physical assets, their location, condition, maintenance, and value.

## Features
- Asset Inventory (Name, Description, Serial Number, Purchase Date, Cost)
- Categories (Electronics, Furniture, Instruments, Vehicles, etc.)
- Location Tracking (Which department or room)
- Condition Monitoring (New, Good, Fair, Poor, Broken)
- Maintenance History (Track repairs and service)
- QR/Barcode Identification (Placeholder for future mobile use)
- Depreciation Calculation (Auto-calculation of current value)
- Responsibility (Who is currently in charge of the asset)

## 1. Database Schema (Supabase)

### Table: `asset_categories`
- `id` (uuid, PK)
- `church_id` (uuid, FK)
- `name` (text)
- `description` (text)
- `created_at`

### Table: `assets`
- `id` (uuid, PK)
- `church_id` (uuid, FK)
- `category_id` (uuid, FK)
- `department_id` (uuid, FK, Nullable)
- `name` (text)
- `description` (text)
- `serial_number` (text, optional)
- `purchase_date` (date)
- `purchase_price` (numeric)
- `condition` (enum: new, good, fair, poor, broken)
- `status` (enum: available, in_use, under_maintenance, disposed)
- `assigned_to` (uuid, FK to members, optional)
- `location` (text)
- `image_url` (text)
- `created_at`
- `updated_at`

### Table: `asset_maintenance`
- `id` (uuid, PK)
- `asset_id` (uuid, FK)
- `maintenance_date` (date)
- `description` (text)
- `cost` (numeric)
- `performed_by` (text)
- `next_maintenance` (date, optional)

## 2. UI Components

### Dashboard View
- KPI Cards: Total Assets Value, Count by Condition, Pending Maintenance.
- Chart: Asset Distribution by Category.

### Asset List
- Search and Filtering (by category, condition, status).
- Grid/List toggle.

### Asset Detail Page
- Timeline of maintenance events.
- Photo gallery.
- Edit/Delete actions.

### Add/Edit Modal
- Forms using standard design system.

## 3. Implementation Steps

### Phase 1: Database & Hooks
- Create migration file for tables.
- Update `database.types.ts`.
- Create `useAssets.ts` hook.

### Phase 2: Core UI
- Create `Assets.tsx` page.
- Implement `AssetModal.tsx`.

### Phase 3: Advanced Features
- Maintenance tracking UI.
- Depreciation reports.

## Verification
- [ ] CRUD operations for categories.
- [ ] CRUD operations for assets.
- [ ] Filtering logic works.
- [ ] Maintenance entries can be added.
- [ ] Dashboard shows correct totals.
