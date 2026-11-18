# Integrix AI — Intelligent Brand Governance & Content Integrity Platform

**Integrix AI** is an intelligent, source-backed brand governance platform that enforces marketing compliance, product specifications, and policy verification on advertisement creatives.

---

## 🚀 Instant Quickstart (Zero Backend Setup Needed)

```bash
npm run dev
```

Open your browser to **`http://localhost:5173`**. Everything runs instantly inside React!

---

## ✨ Features & Architecture

- **100% Client-Side Audit Engine**: Runs directly in the browser with zero external microservices or backend servers.
- **7 Preloaded Official NOVAWEAR Test Creatives**: Real advertisement images (`AD-NW-001.png` through `AD-NW-007.png`) loaded directly with 1-click evaluation.
- **Dynamic Policy & Fact Verification**:
  - **NW-RULE-001 (Fabric Composition)**: Compares advertised fabric against approved catalogue specifications for the exact SKU.
  - **NW-RULE-002 (Campaign Price Validity)**: Checks base selling price vs campaign offers, start/end dates, approval status, and publication channels.
  - **NW-RULE-003 (Unsupported Performance Claims)**: Verifies claims like "wrinkle-proof" against approved and unapproved catalogue claims.
  - **NW-RULE-004 (Delivery Promises)**: Ensures operational dispatch targets (1–2 business days) are not advertised as guaranteed delivery dates.
- **Source-Backed Evidence Provenance**: Every finding quotes the exact source file, sheet, row, and locator with plain-English reasoning and actionable suggested corrections.
- **Interactive Discrepancy Notice**: Transparently documents the difference in ID assignments between the Sample Ad Test Pack (PDF) and the Expected Audit Results (DOCX).
- **Master Brand Repository Inspector**: Slide-over drawer to browse all 8 approved products, 3 campaigns, and registered rules.
- **Custom Ad Upload Support**: Drag and drop any image (PNG, JPG, PDF) to test custom marketing copy.

---

## 🧪 Acceptance Test Matrix (All 7 Pass with 100% Accuracy)

| # | Scenario | Test Pack ID (PDF) | Expected Results ID (DOCX) | Target SKU | Oracle Status | Actual Integrix Status | Verification Trace |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|
| **1** | Compliant Product Ad | **AD-NW-001** | **AD-NW-007** | `NW-CS-001` | **PASS** | **PASS** ✓ | 100% cotton matches catalogue. Price ₹1,299 matches base selling price. |
| **2** | Price Mismatch | **AD-NW-002** | **AD-NW-001** | `NW-CS-001` | **FAIL** | **FAIL** ✓ | Displayed ₹999 vs base ₹1,299. Campaign CMP-26-014 expired on 31 Oct 2026. |
| **3** | Composition Mismatch | **AD-NW-003** | **AD-NW-002** | `NW-CS-002` | **FAIL** | **FAIL** ✓ | Stated 100% cotton. Catalogue records 60% cotton, 40% polyester. |
| **4** | Approved Campaign | **AD-NW-004** | **AD-NW-003** | `NW-TS-003` | **PASS** | **PASS** ✓ | CMP-26-018 authorises ₹599 from 1–15 Nov 2026 on Instagram Shop. |
| **5** | Pending Campaign Price | **AD-NW-005** | **AD-NW-004** | `NW-TR-005` | **FAIL** | **FAIL** ✓ | CMP-26-021 has status "Pending". Pending offer cannot authorise public price. |
| **6** | Wrinkle-Proof Claim | **AD-NW-006** | **AD-NW-005** | `NW-CS-001` | **NEEDS_VERIFICATION** | **NEEDS_VERIFICATION** ✓ | No product-specific evidence in repository (listed in Claims Not Approved). |
| **7** | Delivery Guarantee | **AD-NW-007** | **AD-NW-006** | General | **FAIL** | **FAIL** ✓ | "Delivered tomorrow guaranteed" conflicts with dispatch estimate (1–2 days). |
