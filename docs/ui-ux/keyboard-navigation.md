# Keyboard Navigation

> Complete keyboard shortcut reference and navigation patterns.

---

## 🎯 Design Goals

1. **Everything accessible via keyboard**
2. **Consistent patterns across the app**
3. **Discoverable shortcuts**
4. **Vim-inspired navigation (optional)**

---

## ⌨️ Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + /` | Show keyboard shortcuts |
| `Cmd/Ctrl + N` | New job |
| `Cmd/Ctrl + F` | Global search |
| `Cmd/Ctrl + ,` | Settings |
| `Esc` | Close modal/panel/menu |

---

## 🔍 Entity Quick Access

Type these anywhere to jump to entity search:

| Shortcut | Entity |
|----------|--------|
| `/I` | Inventory search |
| `/L` | Labour search |
| `/S` | Service search |
| `/T` | Template search |
| `/C` | Customer search |
| `/V` | Vehicle search |
| `/J` | Job search |

---

## 📋 List Navigation

When focused on a list (jobs, customers, etc.):

| Shortcut | Action |
|----------|--------|
| `↑` / `K` | Previous item |
| `↓` / `J` | Next item |
| `Enter` | Open selected |
| `Space` | Toggle selection |
| `Cmd + A` | Select all |
| `Home` | First item |
| `End` | Last item |
| `Page Up` | Previous page |
| `Page Down` | Next page |

---

## 📝 Job Detail

When viewing a job:

| Shortcut | Action |
|----------|--------|
| `/` | Add line item (opens type menu) |
| `/I` | Add inventory item |
| `/L` | Add labour item |
| `/S` | Add service |
| `/T` | Add from template |
| `E` | Edit job details |
| `P` | Print |
| `D` | Duplicate job |
| `Delete` | Delete (if in estimate) |

---

## 🔢 Line Item Navigation

When line items section is focused:

| Shortcut | Action |
|----------|--------|
| `↑` / `K` | Previous item |
| `↓` / `J` | Next item |
| `Enter` | Edit item |
| `Delete` | Remove item |
| `Cmd + ↑` | Move item up |
| `Cmd + ↓` | Move item down |
| `Q` | Edit quantity |
| `$` | Edit price |

---

## 🎮 Command Palette

When command palette is open (`Cmd + K`):

| Shortcut | Action |
|----------|--------|
| `↑` / `↓` | Navigate results |
| `Enter` | Execute command |
| `Tab` | Autocomplete |
| `Esc` | Close |
| `Backspace` | Clear/go back |

### Common Commands
```
> New job          → Create new job
> New customer     → Create new customer
> Search jobs      → Open job search
> Settings         → Open settings
> Print            → Print current view
> Export CSV       → Export current list
```

---

## 📝 Forms

| Shortcut | Action |
|----------|--------|
| `Tab` | Next field |
| `Shift + Tab` | Previous field |
| `Enter` | Submit (in text field) |
| `Cmd + Enter` | Submit form |
| `Esc` | Cancel/close |

---

## 🔍 Search Fields

| Shortcut | Action |
|----------|--------|
| `↓` | Open/focus dropdown |
| `↑` / `↓` | Navigate results |
| `Enter` | Select highlighted |
| `Esc` | Close dropdown |
| `Cmd + Backspace` | Clear field |

---

## 💡 Discoverability

### Shortcut Hints
- Show shortcut hints next to actions
- Tooltip shows "⌘K" next to command palette button
- Menu items show keyboard shortcuts

### Help Modal (`Cmd + /`)
- Categorized shortcut list
- Context-aware (shows shortcuts for current view)
- Search within shortcuts

---

## ⚙️ Customization (Future)

- Vim mode toggle (J/K navigation)
- Custom shortcut mapping
- Shortcut profiles

---

*See [Design System](./design-system.md) for visual styling of keyboard hints.*

