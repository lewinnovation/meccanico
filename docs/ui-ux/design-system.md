# Design System

> Colors, typography, spacing, and visual standards.

---

## 🎨 Color Palette

### Primary Colors
```css
--primary-50:  #E8F4FD;
--primary-100: #C5E3FA;
--primary-200: #9DD0F6;
--primary-300: #75BCF2;
--primary-400: #57ADEF;
--primary-500: #399DEB;  /* Main primary */
--primary-600: #338FD9;
--primary-700: #2C7DC2;
--primary-800: #256CAC;
--primary-900: #194D85;
```

### Neutral Colors
```css
--gray-50:  #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #EEEEEE;
--gray-300: #E0E0E0;
--gray-400: #BDBDBD;
--gray-500: #9E9E9E;
--gray-600: #757575;
--gray-700: #616161;
--gray-800: #424242;
--gray-900: #212121;
```

### Entity Colors
```css
/* Inventory - Blue */
--entity-inventory-bg: #E3F2FD;
--entity-inventory-text: #1976D2;

/* Labour - Orange */
--entity-labour-bg: #FFF3E0;
--entity-labour-text: #F57C00;

/* Service - Green */
--entity-service-bg: #E8F5E9;
--entity-service-text: #388E3C;

/* Template - Purple */
--entity-template-bg: #F3E5F5;
--entity-template-text: #7B1FA2;

/* Job - Yellow */
--entity-job-bg: #FFFDE7;
--entity-job-text: #FBC02D;

/* Customer - Pink */
--entity-customer-bg: #FCE4EC;
--entity-customer-text: #C2185B;

/* Vehicle - Teal */
--entity-vehicle-bg: #E0F2F1;
--entity-vehicle-text: #00796B;

/* Text/Custom - Gray */
--entity-text-bg: #FAFAFA;
--entity-text-text: #424242;
```

### Status Colors
```css
--status-estimate: #FFC107;    /* Amber */
--status-approved: #2196F3;    /* Blue */
--status-progress: #FF9800;    /* Orange */
--status-hold: #9E9E9E;        /* Gray */
--status-invoiced: #9C27B0;    /* Purple */
--status-paid: #4CAF50;        /* Green */
--status-cancelled: #F44336;   /* Red */
--status-declined: #795548;    /* Brown */
--status-disputed: #E91E63;    /* Pink */
```

---

## 📝 Typography

### Font Stack
```css
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Scale
| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 32px | 600 | 1.2 | Page titles |
| H1 | 24px | 600 | 1.3 | Section headers |
| H2 | 20px | 600 | 1.4 | Card titles |
| H3 | 16px | 600 | 1.4 | Subsections |
| Body | 14px | 400 | 1.5 | Default text |
| Small | 12px | 400 | 1.4 | Captions, labels |
| Tiny | 10px | 500 | 1.3 | Badges, codes |

### Code/Monospace
| Name | Size | Usage |
|------|------|-------|
| Code | 13px | Entity codes (J001) |
| Code-sm | 11px | Inline code |

---

## 📏 Spacing

### Scale (4px base)
```css
--space-1: 4px;   /* Tight */
--space-2: 8px;   /* Default gap */
--space-3: 12px;  /* Medium */
--space-4: 16px;  /* Section padding */
--space-5: 20px;  /* Large */
--space-6: 24px;  /* Card padding */
--space-8: 32px;  /* Section margin */
--space-10: 40px; /* Page padding */
--space-12: 48px; /* Large sections */
```

---

## 🔲 Borders & Shadows

### Border Radius
```css
--radius-sm: 4px;   /* Buttons, inputs */
--radius-md: 8px;   /* Cards */
--radius-lg: 12px;  /* Modals */
--radius-full: 9999px; /* Pills, avatars */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.07);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
```

---

## 🎯 Component Patterns

### Cards
```css
.card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
```

### Entity Badges
```css
.badge-inventory {
  background: var(--entity-inventory-bg);
  color: var(--entity-inventory-text);
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
```

### Status Pills
```css
.status-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
}
```

---

## 📐 Layout

### Sidebar
- Width: 240px (desktop), collapsible
- Background: `--gray-50`
- Border right: 1px `--gray-200`

### Main Content
- Max width: 1200px
- Padding: `--space-8`

### Tables
- Row height: 48px
- Header: sticky, `--gray-50` background
- Hover: `--gray-100`

---

*See [Components](./components.md) for implementation details.*

