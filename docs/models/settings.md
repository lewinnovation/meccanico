# Settings Entity

> Settings store system-wide configuration values.

---

## 📋 Overview

| Property | Value |
|----------|-------|
| **Table Name** | `settings` |
| **Audited** | Yes |

Settings are key-value pairs that configure shop-wide behavior like tax rates, currency, and invoice templates.

---

## 🗄️ Database Schema

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_settings_key ON settings(key);
```

---

## 🔧 Setting Keys

| Key | Type | Description |
|-----|------|-------------|
| `shop.name` | string | Shop business name |
| `shop.address` | string | Shop address |
| `shop.phone` | string | Shop phone number |
| `shop.email` | string | Shop email |
| `shop.logo` | string | Logo URL/base64 |
| `tax.default_rate` | number | Default tax rate (%) |
| `tax.name` | string | Tax label (e.g., "GST") |
| `currency.code` | string | Currency code (e.g., "USD") |
| `currency.symbol` | string | Currency symbol (e.g., "$") |
| `odometer.unit` | string | Default odometer unit: 'km', 'miles', or 'hours' |
| `invoice.prefix` | string | Invoice number prefix |
| `invoice.terms` | string | Default invoice terms |
| `invoice.footer` | string | Invoice footer text |

---

## 🌐 API Endpoints

```
GET  /api/settings           - Get all settings
GET  /api/settings/:key      - Get single setting
PUT  /api/settings/:key      - Update setting (Admin)
POST /api/settings/logo      - Upload logo (Admin)
```

---

*See also: [User](./user.md) | [Job](./job.md)*

