# SignFlow Manager - SaaS Job Management System

## 1. Project Overview

**Project Name**: SignFlow Manager  
**Type**: Full-stack SaaS Web Application  
**Core Functionality**: A Kanban-based job tracking system for sign-making businesses to manage orders from quote to installation  
**Target Users**: Sign shop owners, graphic designers, production staff, and installers

---

## 2. Technical Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui-inspired design
- **Drag & Drop**: @hello-pangea/dnd
- **State Management**: React Context + useState/useReducer
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based with bcrypt password hashing
- **Validation**: Zod

### Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("user")
  createdAt DateTime @default(now())
  jobs      Job[]
}

model Job {
  id              String   @id @default(uuid())
  displayId       String   @unique
  clientName      String
  clientContact   String
  jobDescription  String
  orderDate       DateTime
  paymentDate     DateTime?
  targetDate      DateTime?
  currentStatus   String   @default("Quote/Pending")
  assignedTo      String?
  proofLink       String?
  materialsNeeded String?
  installationDate DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  userId          String
  user            User     @relation(fields: [userId], references: [id])
}
```

---

## 3. UI/UX Specification

### Color Palette
- **Primary**: `#2563eb` (Royal Blue)
- **Primary Hover**: `#1d4ed8`
- **Secondary**: `#475569` (Slate)
- **Background**: `#f8fafc` (Light Slate)
- **Surface**: `#ffffff` (White)
- **Text Primary**: `#1e293b`
- **Text Secondary**: `#64748b`
- **Border**: `#e2e8f0`

### Status Colors
- **Quote/Pending**: `#f59e0b` (Amber)
- **Ready for Proofing**: `#3b82f6` (Blue)
- **Awaiting Proof Approval**: `#8b5cf6` (Violet)
- **Materials Ordered**: `#06b6d4` (Cyan)
- **Manufacturing/Production**: `#ec4899` (Pink)
- **Ready for Dispatch/Installation**: `#f97316` (Orange)
- **Completed/Delivered**: `#10b981` (Emerald)

### Typography
- **Font Family**: "Inter", system-ui, sans-serif
- **Headings**: 
  - H1: 24px, font-weight 700
  - H2: 20px, font-weight 600
  - H3: 16px, font-weight 600
- **Body**: 14px, font-weight 400
- **Small**: 12px, font-weight 400

### Spacing System
- Base unit: 4px
- Padding: 8px, 12px, 16px, 24px
- Margins: 8px, 16px, 24px, 32px
- Border radius: 6px (inputs), 8px (cards), 12px (modals)

### Layout Structure

#### Desktop (≥1024px)
- **Sidebar**: 240px fixed width, collapsible
- **Main Content**: Fluid, fills remaining space
- **Kanban**: Horizontal scroll with 6 columns

#### Tablet (768px - 1023px)
- **Sidebar**: Collapsed by default, icon-only
- **Main Content**: Full width
- **Kanban**: Horizontal scroll, smaller cards

#### Mobile (<768px)
- **Sidebar**: Hidden, hamburger menu
- **Main Content**: Full width
- **Kanban**: Vertical stacked view or toggle to list

---

## 4. Components Specification

### Sidebar Navigation
- Logo/App name at top
- Navigation items with icons:
  - Dashboard (home icon)
  - Jobs (kanban icon)
  - List View (list icon)
  - Reports (chart icon)
- User profile at bottom
- Logout button

### Header
- Search bar (global search)
- "New Job" button (primary action)
- User avatar/menu

### Kanban Board
- 6 columns matching workflow stages
- Column headers show count
- Drag-and-drop cards between columns
- Card shows: Job ID, Client Name, Due Date, Assigned To
- Click card to open detail modal

### Job Card
- Compact card design (280px width on desktop)
- Status indicator (colored left border)
- Job ID badge
- Client name (bold)
- Job description (truncated)
- Due date with icon
- Assigned person avatar/initials

### Job Detail Modal
- Full job information
- Editable fields
- Notes section with timestamps
- Status change dropdown
- Delete job option

### New Job Form
- Modal or slide-out panel
- Fields:
  - Client Name (required)
  - Client Contact (required)
  - Job Description (required)
  - Target Date (date picker)
  - Assigned To (dropdown)
  - Notes (textarea)
- Submit and Cancel buttons

### Dashboard
- Stats cards:
  - Total Active Jobs
  - Jobs This Month
  - Awaiting Approval
  - Overdue Jobs
- Recent activity feed
- Quick actions

### List View
- Sortable table
- Columns: ID, Client, Status, Due Date, Assigned To, Actions
- Pagination
- Bulk actions

---

## 5. Functionality Specification

### Authentication
- Login page with email/password
- Register page for new users
- JWT token storage in localStorage
- Protected routes
- Logout functionality

### Job Management

#### Create Job
- Click "New Job" button
- Fill form (Client Name, Contact, Description required)
- Auto-generate Job ID (SIGN-001, SIGN-002, etc.)
- Default status: "Quote/Pending"
- Save to database

#### View Jobs
- Kanban board view (default)
- List view (sortable table)
- Toggle between views

#### Edit Job
- Click job card to open detail modal
- Edit any field
- Save changes
- Updated timestamp recorded

#### Delete Job
- Delete button in detail modal
- Confirmation dialog
- Soft delete or hard delete

### Workflow Stages
1. **Quote/Pending** - Initial state when job created
2. **Ready for Proofing** - Payment received, ready for design
3. **Awaiting Proof Approval** - Proof sent to client
4. **Materials Ordered** - Proof approved, materials on order
5. **Manufacturing/Production** - In production
6. **Ready for Dispatch/Installation** - Finished, ready to ship/install
7. **Completed/Delivered** - Job done

### Drag and Drop
- Drag cards between columns
- Updates status automatically
- Optimistic UI update
- Reorder within columns

### Search & Filter
- Global search by client name or job ID
- Filter by status
- Filter by assigned person
- Filter by date range

### Notifications
- Toast notifications for actions
- Success/error messages
- Auto-dismiss after 3 seconds

### Reports
- Jobs completed this month
- Jobs by status breakdown
- Overdue jobs count

---

## 6. API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - Get all jobs for user
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `PATCH /api/jobs/:id/status` - Update job status

---

## 7. Acceptance Criteria

### Visual Checkpoints
- [ ] Sidebar displays correctly with all navigation items
- [ ] Kanban board shows 6 columns with correct status colors
- [ ] Job cards display all required information
- [ ] Drag and drop works smoothly
- [ ] Modal opens and closes properly
- [ ] Forms validate required fields
- [ ] Mobile responsive layout works

### Functional Checkpoints
- [ ] User can register and login
- [ ] User can create new job
- [ ] Job ID auto-generates correctly
- [ ] Status changes persist after refresh
- [ ] Search filters jobs correctly
- [ ] Dashboard stats are accurate

### Performance
- [ ] Page loads in under 2 seconds
- [ ] Drag and drop is smooth (60fps)
- [ ] No console errors

---

## 8. File Structure

```
/workspace/signflow-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Utilities
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── tsconfig.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth middleware
│   │   ├── prisma/        # Database schema
│   │   └── index.ts       # Server entry
│   ├── package.json
│   └── tsconfig.json
├── package.json            # Root package.json
└── README.md
```
