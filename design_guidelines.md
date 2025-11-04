# Store Management System - Design Guidelines

## Design Approach

**System-Based Approach**: This utility-focused dashboard draws inspiration from modern SaaS productivity tools like Linear, Notion, and Stripe, emphasizing clarity, data density, and efficient workflows. The design prioritizes information hierarchy, scannable data tables, and streamlined interactions for daily business operations.

---

## Core Design Principles

1. **Data First**: Information hierarchy optimized for quick scanning and decision-making
2. **Efficiency Over Aesthetics**: Every element serves a functional purpose
3. **Consistent Patterns**: Reusable components reduce cognitive load
4. **Responsive Precision**: Graceful adaptation from desktop to mobile

---

## Typography System

### Font Stack
- **Primary**: Inter (via Google Fonts CDN) - for UI elements, tables, labels
- **Secondary**: System font stack for data/numbers - for enhanced readability in tables

### Hierarchy
- **Page Titles**: text-2xl font-semibold (Dashboard, Inventory Management, Cashflow Tracker)
- **Section Headers**: text-xl font-semibold (Summary Statistics, Recent Transactions)
- **Card Titles**: text-lg font-medium (metric cards, product names)
- **Body Text**: text-base font-normal (descriptions, table content)
- **Labels**: text-sm font-medium (form labels, table headers)
- **Captions/Meta**: text-xs font-normal (timestamps, secondary info)
- **Numbers/Currency**: text-base font-semibold tabular-nums (for data alignment)

---

## Layout System

### Spacing Primitives
Core spacing units: **2, 4, 6, 8, 12, 16** (Tailwind units)
- Tight spacing: p-2, gap-2 (within buttons, chips)
- Standard spacing: p-4, gap-4 (card padding, form fields)
- Section spacing: p-6, gap-6 (between card sections)
- Page margins: p-8 (main content areas)
- Large separations: mt-12, mb-16 (between major sections)

### Grid Structure
- **Dashboard**: 3-column grid on desktop (lg:grid-cols-3), 2-col tablet (md:grid-cols-2), 1-col mobile
- **Tables**: Full-width with horizontal scroll on mobile
- **Forms/Modals**: Single column, max-w-lg centered
- **Sidebar Navigation**: Fixed 64px wide (collapsed) / 240px wide (expanded) on desktop

### Container Strategy
- Main content wrapper: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Dashboard cards: Full width within grid cells
- Modal containers: max-w-md to max-w-lg

---

## Component Library

### Navigation
**Sidebar (Desktop)**
- Fixed left sidebar with logo/brand at top
- Navigation items: icon + label, stack vertically
- Active state: subtle background treatment
- Collapsed state: show icons only with tooltips

**Mobile Navigation**
- Top bar with hamburger menu
- Slide-out drawer for navigation items
- Full-screen overlay when open

### Dashboard Cards (Metric Cards)
- Border-based cards with rounded corners (rounded-lg)
- Padding: p-6
- Structure: Label (text-sm) + Large number (text-3xl font-bold) + Optional trend indicator
- Hover state: subtle elevation treatment
- Layout: Stack label above number, align-left

### Data Tables
**Structure**
- Sticky header with medium weight labels
- Alternating row treatment for scanability
- Compact row height (h-12 to h-14)
- Right-aligned numbers, left-aligned text
- Action buttons in rightmost column

**Mobile Treatment**
- Convert to card-based layout stacking fields vertically
- Show only essential columns with "View Details" expansion

### Forms & Modals
**Modal Overlay**
- Semi-transparent backdrop
- Modal container: centered, max-w-md, rounded-lg
- Close button: top-right corner (×)
- Padding: p-6

**Form Structure**
- Vertical stack with gap-4
- Label above input pattern
- Input fields: h-10, rounded-md border
- Full-width inputs by default
- Button group: flex justify-end gap-3 at bottom

**Input States**
- Default: neutral border
- Focus: prominent border with ring treatment
- Error: error-state border with helper text below
- Disabled: reduced opacity

### Buttons
**Primary Button**
- Height: h-10
- Padding: px-6
- Rounded: rounded-md
- Font: text-sm font-medium
- Full-width on mobile, auto-width on desktop

**Secondary Button**
- Same dimensions as primary
- Border-based treatment

**Icon Buttons**
- Square: w-8 h-8 or w-10 h-10
- Centered icon
- Rounded: rounded-md
- Use for table actions (Edit, Delete)

### Summary Statistics Bar
- Horizontal flex layout (flex-wrap on mobile)
- Each stat: Label + Value pair
- Separator between stats (border-r)
- Padding: py-4 px-6
- Background treatment distinct from main content

### Transaction/Movement Lists
- Card-based list items
- Each item: Icon + Details (left) + Amount/Action (right)
- Timestamp below description
- Divider between items
- Max height with scroll for long lists

---

## Page-Specific Layouts

### Dashboard (Home)
**Structure (top to bottom)**
1. Page title + date/time indicator
2. Metric cards grid (4 cards: Stock Value, Cash Balance, Product Count, Low Stock Alert)
3. Two-column section: Recent Transactions (left) + Quick Actions (right)
4. Chart section (optional): Stock value trend or cashflow over time

### Inventory Management
**Structure**
1. Page title + "Add Product" button (right-aligned)
2. Summary bar: Total Products | Total Stock | Total Value
3. Filters row: Category dropdown + Search input
4. Products table: Name | Category | Unit Price | Stock | Total Value | Actions
5. Pagination footer if needed

**Add/Subtract Stock Modal**
- Product name (read-only display)
- Quantity input (number field)
- Reason dropdown (Sale, Restock, Damage, Adjustment)
- Note textarea
- Buttons: Cancel + Confirm

### Cashflow Tracker
**Structure**
1. Page title + "Add Income" and "Add Expense" buttons
2. Balance overview card: Current Balance (large) + Initial Capital (editable) + Net Balance
3. Summary row: Total Income | Total Expenses | Transaction Count
4. Filters: Type toggle (All/Income/Expense) + Date range + Category
5. Transactions table: Date | Type | Category | Description | Amount
6. Pagination

**Add Transaction Modal**
- Type selector: Income/Expense (toggle or radio)
- Amount input (currency)
- Category dropdown
- Description textarea
- Date picker (default: today)
- Buttons: Cancel + Save Transaction

---

## Responsive Behavior

### Breakpoints
- Mobile: base (< 640px)
- Tablet: md (640px - 1024px)
- Desktop: lg (1024px+)

### Adaptive Patterns
- **Navigation**: Sidebar (desktop) → Top bar + drawer (mobile)
- **Tables**: Scrollable (tablet) → Card list (mobile)
- **Grid cards**: 3-col → 2-col → 1-col
- **Forms**: Always single column, but adjust padding
- **Buttons**: Full-width on mobile, auto-width on desktop

---

## Micro-Interactions (Minimal)

- **Hover states**: Subtle background change on interactive elements
- **Focus states**: Keyboard navigation with clear focus rings
- **Loading states**: Skeleton screens for table data, spinner for button actions
- **Success feedback**: Toast notification (top-right) for successful actions
- **Transitions**: smooth 150ms ease for hover/focus (avoid excessive animation)

---

## Icons

**Library**: Heroicons (via CDN)
**Usage**:
- Navigation items: outline style, 20px
- Metric cards: outline style, 24px
- Table actions: outline style, 16px
- Form inputs: outline style, 20px (prefix icons)
- Transaction types: solid style for visual distinction (arrow-up for income, arrow-down for expense)

---

## Accessibility

- All interactive elements keyboard accessible
- Proper focus management in modals
- ARIA labels for icon-only buttons
- Form inputs with associated labels
- Error messages announced to screen readers
- Sufficient contrast ratios maintained throughout
- Table headers properly scoped

---

## Images

**Not Required**: This is a data-focused business application. No hero images or decorative imagery needed. Focus is on clean, functional UI with data visualization through charts/graphs if implemented.