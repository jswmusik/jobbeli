# Component Inventory & Architecture: Feriearbete

This document provides a comprehensive list of all React components required for the project. It distinguishes between **UI Primitives** (shared design system) and **Domain Components** (feature-specific logic).

---

## 1. UI Primitives (`src/components/ui`)
These are the base building blocks derived from **shadcn/ui**. [cite_start]They contain no business logic, only styling and accessibility features [cite: 878-879].

### Forms & Inputs
* [cite_start]**`Button`**: Variants include Default, Secondary, Ghost, Link, and Destructive[cite: 881].
* [cite_start]**`Input`**: Standard text fields for forms[cite: 882].
* [cite_start]**`Textarea`**: Multi-line text input (e.g., for cover letters)[cite: 883].
* [cite_start]**`Checkbox`**: Used for Terms of Service and Filters[cite: 884].
* [cite_start]**`Switch`**: Toggles for "Active/Inactive" states[cite: 885].
* [cite_start]**`RadioGroup`**: Selection inputs, primarily for Quiz questions[cite: 886].
* [cite_start]**`Select`**: Simple dropdown menus[cite: 887].
* [cite_start]**`Combobox`**: Searchable dropdowns (Critical for "Select School" or "Municipality")[cite: 888].
* [cite_start]**`DatePicker`**: Date selection; includes `DateRangePicker` for Lottery Periods[cite: 889].
* [cite_start]**`Slider`**: Range inputs[cite: 890].
* [cite_start]**`Form`**: Wrapper component integrating `react-hook-form` and `zod` validation[cite: 891].

### Layout & Containers
* [cite_start]**`Card`**: The primary container with Header, Content, and Footer sections[cite: 893].
* [cite_start]**`Sheet`**: Slide-out sidebar used for Mobile Menus and Admin Filters[cite: 894].
* [cite_start]**`Dialog`**: Modals for actions like "Confirm Delete" or "Apply Now"[cite: 895].
* [cite_start]**`ScrollArea`**: Custom scrollbar for long lists inside cards[cite: 896].
* [cite_start]**`Tabs`**: Switching views (e.g., "Active Jobs" vs. "Archived Jobs")[cite: 897].
* [cite_start]**`Separator`**: Visual dividers[cite: 898].
* [cite_start]**`AspectRatio`**: Ensures consistent image dimensions[cite: 899].

### Data Display
* [cite_start]**`Table`**: The core component for Admin lists[cite: 901].
* [cite_start]**`Badge`**: Status pills (e.g., "Open", "Closed", "Pending")[cite: 902].
* [cite_start]**`Avatar`**: User profile images[cite: 903].
* [cite_start]**`Accordion`**: Collapsible sections for FAQ or Course Chapters[cite: 904].
* [cite_start]**`HoverCard`**: Previews details on mouse hover[cite: 905].

### Feedback & Overlays
* [cite_start]**`Toast`**: Transient notifications (e.g., "Saved successfully")[cite: 907].
* [cite_start]**`Alert`**: prominent error or warning messages (e.g., "BankID Failed")[cite: 908].
* [cite_start]**`Skeleton`**: Loading state placeholders (gray bars)[cite: 909].
* [cite_start]**`Progress`**: Visual bars for Course completion and Simulation status[cite: 910].
* [cite_start]**`Tooltip`**: Help icons and hints[cite: 911].
* [cite_start]**`DropdownMenu`**: The "..." action menu on table rows[cite: 912].

---

## 2. Global & Navigation Components (`src/components/shared`)
[cite_start]High-level components used across the application layout [cite: 958-964].

* [cite_start]**`AdminSidebar`**: Collapsible desktop sidebar for Municipality/Company admins[cite: 959].
* [cite_start]**`YouthMobileNav`**: Bottom tab bar specifically for the Youth mobile view[cite: 960].
* [cite_start]**`MunicipalitySwitcher`**: Dropdown header allowing Super Admins to switch contexts[cite: 961].
* [cite_start]**`LanguageToggle`**: Flag switcher for Swedish/English/Arabic/Ukrainian[cite: 962].
* [cite_start]**`EmptyState`**: Standard illustration + text when no items are found[cite: 963].
* [cite_start]**`ErrorBoundary`**: Fallback UI to prevent white-screen crashes[cite: 964].

---

## 3. Domain Components (`src/components/domains`)
These components contain specific feature logic and connect to the API.

### [cite_start]A. Jobs Domain (`/jobs`) [cite: 915-922]
* **`JobCard`**: The primary view for youth. Displays Image, Title, Municipality, and "Apply" button.
* **`JobRow`**: Admin table row displaying stats (e.g., "15 Applicants").
* **`JobFilterSidebar`**: Faceted search (Categories: "Park", "Care", "Office").
* **`JobForm`**: The master Create/Edit form for Admins.
* [cite_start]**`DynamicFieldRenderer`**: **Critical.** Renders custom JSON fields (e.g., specific schools) defined by the Municipality configuration[cite: 920].
* **`ApplicationModal`**: The popup form triggered when a Youth clicks "Apply".
* **`ApplicationStatusTracker`**: Visual stepper showing: Applied -> Lottery -> Matched.

### [cite_start]B. Lottery Domain (`/lottery`) [cite: 923-929]
* **`PeriodConfigForm`**: Inputs to define date ranges for summer periods (Period 1, 2, 3).
* **`GroupPriorityList`**: Drag-and-drop interface for ordering Job Groups.
* **`SimulationDashboard`**: The "Run Simulation" button and live console log viewer.
* **`MatchRateChart`**: Pie/Bar chart showing "Matched" vs "Unmatched" distribution.
* **`UnmatchedYouthTable`**: List of applicants who didn't win, with a "Manual Assign" action.
* **`LotteryReportViewer`**: PDF wrapper for viewing the Audit Report.

### [cite_start]C. Identity & Auth (`/auth` & `/users`) [cite: 930-935]
* **`BankIDLoginButton`**: Standardized branding for "Log in with BankID".
* **`GuardianVerifyCard`**: The specific landing component for Guardians to click "Approve".
* **`ProtectedIdentityShield`**: Icon and Tooltip indicating a user has "Skyddad Identitet".
* **`YouthProfileForm`**: Form for editing profile; locks SSN fields but allows CV edits.
* [cite_start]**`ManualVerificationModal`**: Admin-only component for the "Ghost Protocol" override (verifying protected identity physically)[cite: 282].

### [cite_start]D. Files & Security (`/files`) [cite: 936-939]
* **`SecureUploadDropzone`**: Drag & drop area showing upload progress.
* **`VirusScanStatus`**: Animated icon changing states: Scanning -> Safe (Green) or Infected (Red).
* **`FilePreviewList`**: Grid/List of uploaded files with "Delete" actions.

### [cite_start]E. CV Builder & AI (`/cv-builder`) [cite: 940-944]
* **`AIPromptInput`**: Textarea combined with a "Magic Wand" button to trigger generation.
* **`CVPreviewDocument`**: A4-sized HTML rendering of the resume for preview.
* **`SkillTagSelector`**: Combobox that adds removable pill tags for skills.
* **`ExperienceTimeline`**: Vertical list of Work/School history (drag-and-drop enabled).

### [cite_start]F. Education (`/education`) [cite: 945-949]
* **`CourseCard`**: Thumbnail, Progress bar, and Title for the catalog.
* **`VideoPlayerWrapper`**: Wrapper that tracks "Watched Time" to mark completion.
* **`QuizModule`**: Displays Question + Radio Options + "Check Answer" button.
* **`CertificateDownload`**: Button state handling (Locked vs Unlocked).

### [cite_start]G. CMS (`/cms`) [cite: 950-953]
* **`BlockEditor`**: Simplified rich-text editor for Admins to write content.
* **`SEOMetaEditor`**: Inputs for Meta Title, Description, and OG Image.
* **`ImagePickerModal`**: Modal to select images from the media library.
* [cite_start]**`PageBuilder`**: Drag-and-drop interface for constructing page layouts[cite: 400].

### [cite_start]H. Finance (`/finance`) [cite: 954-957]
* **`PlanPricingCard`**: Display columns for plans (Basic, Pro, Enterprise).
* **`StripePaymentElement`**: Wrapper for Stripe's secure credit card input.
* **`InvoiceDownloadTable`**: List of past invoices with PDF download links.