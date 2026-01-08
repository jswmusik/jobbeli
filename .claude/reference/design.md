# Design System: Feriearbete.se

**Version:** 1.0.0
**Core Philosophy:** "Official Trust (Verksamt.se) meets Youth Energy (Monster.com)."
**Visual Style:** Flat, Airy, High-Contrast, Spacious.
**Constraint:** **NO GRADIENTS.** **NO ROUNDED CORNERS > 4px.**

---

## 1. Color Palette

We combine a bold, energetic brand triad with a functional purple scale for depth.

### 1.1 Brand Colors (The "Monster" Vibe)
| Role | Color Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | **Monster Purple** | `#5E35B1` | Main Actions, Header Backgrounds, Active Borders. |
| **Success** | **Tile Green** | `#00C853` | "Apply Now" Buttons, Success States, Match Confirmed. |
| **Accent** | **Fire Orange** | `#FF5722` | Secondary CTAs, "Hot Job" tags, Urgency indicators. |

### 1.2 The Purple Background Scale (5 Levels)
*Used to create depth in a flat design system without shadows.*

* **Level 1 (Darkest)**: `#311B92` (Sidebar Backgrounds, Footer)
* **Level 2**: `#4527A0` (Hover States, Active Elements)
* **Level 3**: `#673AB7` (Brand Middle / Decorative Accents)
* **Level 4**: `#D1C4E9` (Table Headers, Section Highlights)
* **Level 5 (Lightest)**: `#EDE7F6` (Main Body Background - "Airy" feel)

### 1.3 Functional Colors (Status Pills)
* **Info (Blue)**: `#2979FF` (Status: Applied, Info alerts)
* **Warning (Amber)**: `#FFC107` (Status: Pending Guardian, Expiring)
* **Error/Delete (Red)**: `#D32F2F` (Status: Rejected, Destructive Actions)
* **Neutral (Gray)**: `#757575` (Status: Draft, Archived)

### 1.4 Neutrals (The "Verksamt" Cleanliness)
* **Page Background**: `#F8F9FA` (Very light gray, almost white)
* **Card Background**: `#FFFFFF` (Pure White)
* **Borders**: `#E0E0E0` (Subtle 1px borders)
* **Text Primary**: `#1A1A1A` (High contrast black)
* **Text Secondary**: `#5F6368` (Legible gray)

---

## 2. Shape & Spacing Rules

**Reference:** *Verksamt.se* (Large fields, distinct containers).

### 2.1 Border Radius
* **Strict Limit:** **Max 4px** (`rounded-sm`).
* **Usage:** Buttons, Inputs, Cards, Modals.
* **Banned:** Fully rounded "Pill" buttons or large 12px+ corners.

### 2.2 Inputs & Forms
* **Height:** Large / Chunky (`h-14` or `56px`).
* **Borders:** Visible 1px border (`#E0E0E0`).
* **Focus State:** Border turns **Monster Purple** (`2px`). No glow/ring.
* **Labels:** Uppercase, Bold, Small (`text-xs font-bold tracking-wide`).

### 2.3 Containment (Cards)
* **Style:** Flat white box.
* **Border:** 1px Solid Gray (`#E0E0E0`).
* **Hover:** Border turns Purple (`#5E35B1`). **NO SHADOW LIFTS.**
* **Padding:** Massive (`p-8` or `p-10`). Do not crowd content.

---

## 3. Typography

**Font Family:** *Inter* or *Plus Jakarta Sans* (Geometric, clean).

* **Headings (H1/H2):** ExtraBold (`font-extrabold`). Large sizes (`text-4xl`+). Color: `#1A1A1A` or `#5E35B1`.
* **Body:** Regular weight. High readability (`text-base` or `16px`). Color: `#1A1A1A`.
* **Meta/Labels:** Medium weight. Color: `#5F6368`.

---

## 4. Iconography

**Library:** Lucide React or Heroicons (Solid).

* **Style:** Flat, Monotone.
* **Color:** Inherits text color or Brand Purple.
* **BANNED:**
    * ❌ No Gradients.
    * ❌ No 3D Renders.
    * ❌ No "Robot" or "Brain" icons for AI. Use ✨ (Sparkles) or ⚡ (Bolt).

---

## 5. UI Component Specs

### 5.1 Primary Button
* **Bg:** Monster Purple (`#5E35B1`).
* **Text:** White.
* **Radius:** 4px.
* **Hover:** Darker Purple (`#4527A0`). No Shadow.

### 5.2 Secondary Button
* **Bg:** Transparent.
* **Border:** 2px Solid Purple (`#5E35B1`).
* **Text:** Purple (`#5E35B1`).
* **Radius:** 4px.

### 5.3 Badges / Chips
* **Bg:** Light functional color (e.g., `#E8F5E9` for Green).
* **Text:** Dark functional color (e.g., `#00C853`).
* **Radius:** 4px.
* **Style:** Flat.

### 5.4 Navigation
* **Header:** White BG + 1px Gray Border OR Purple 900 BG (`#311B92`) + White Text.
* **Sidebar:** Purple 900 BG (`#311B92`). White Text. Active item gets Purple 700 (`#4527A0`).

---

## 6. Layout Principles

1.  **Single Column Mobile:** Stacked large cards.
2.  **Two/Three Column Desktop:** Strict grid. No Masonry.
3.  **Whitespace:** Use whitespace to separate sections, not lines/dividers.
4.  **Action Areas:** The "Next Step" or "Apply" button should always be the most prominent, high-contrast element on the page (Green or Purple).