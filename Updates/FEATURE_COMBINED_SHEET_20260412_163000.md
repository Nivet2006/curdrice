# Feature: Combined Attendance Sheet Export
Date: 2026-04-12 16:30:00

## Overview
Implemented a "Combined Sheet" export feature for administrators. This tool generates a multi-sheet Excel workbook (`.xlsx`) containing detailed attendance data for all students across 8 semesters.

## Key Components

### 1. Excel Generation API (`app/api/admin/combined-sheet/route.ts`)
- **Library:** Uses `exceljs` for high-fidelity spreadsheet creation.
- **Security:** Uses `supabaseAdmin` (service role) to bypass RLS for cross-user data aggregation, protected by a strict role check (Admin/Manager only).
- **Functionality:**
    - Queries all students, events, constraints, and registrations.
    - Filters events per semester based on `event_constraints` (if applicable).
    - Generates 8 individual semester sheets (`Sem 1` to `Sem 8`).
    - **Freezing:** Panes are frozen at (Column B, Row 2) so Names/USNs remain visible while scrolling.
    - **Formulas:** Includes live `COUNTIF` formulas at the bottom of each sheet for summary counts.
    - **Summary Sheet:** A dashboard-style sheet showing aggregate metrics per semester (Total Students, Events, Attendance %).

### 2. UI Component (`components/admin/CombinedSheetButton.tsx`)
- **Animated Overlay:** Implemented a specialized `ExcelOverlay` that simulates a spreadsheet being "woven" together during the generation process.
- **Progress Steps:** Displays 5 logical steps to the user:
    1. Fetching student profiles
    2. Loading events & constraints
    3. Weaving attendance matrix
    4. Styling worksheets
    5. Packaging workbook
- **Auto-Theme:** The overlay automatically detects and responds to `data-theme` changes.

### 3. Integration
- The button is prominently placed in the `Attendance Portal` header for quick access.

## Dependencies
- `exceljs`: Added for server-side `.xlsx` generation.
