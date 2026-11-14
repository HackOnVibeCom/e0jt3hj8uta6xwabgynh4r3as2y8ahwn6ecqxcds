# StockPilot AI · F&B Inventory

**Description**
| -> Smart inventory, expiry and waste management for restaurants and cafés, with on-device AI that predicts which stock will expire unused.

- StockPilot AI is a web application built for small and medium food & beverage (F&B) businesses. Staff record daily stock movements in seconds, while the owner gets a full overview of stock levels, expiry risk, waste and AI-driven insights.

The AI runs entirely in the browser. There is no server, no API key and no internet connection needed for predictions.

**Table of Contents**
1. Overview
2. Roles at a Glance
3. Part 1 – Owner
4. Part 2 – Staff
5. AI Inventory Intelligence
6. Tech Stack
7. Project Structure
8. Run Locally
9. Data Storage & Privacy
10. Limitations
12. Roadmap

**Overview**                                                                                                                                
|                |                                                                                                                                          |
|----------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Problem        | F&B businesses lose money through spoiled ingredients, over-ordering and manual stock logs.                                              |
| Solution       | One shared inventory with two roles (Owner and Staff), full activity logs, expiry/waste tracking and local machine-learning predictions. |
| Target users   | Owners, managers and kitchen staff of restaurants, cafés, bakeries and food stalls.                                                      |
| Target markets | Malaysia (RM) and Singapore (SGD) first, with USD support for wider markets.                                                             |
| Currencies     | RM, SGD, USD         

**Roles at a Glance**
Both roles see the same shared inventory and stock quantities. What differs is what each role can manage.

| Feature                                                     | Owner  | Staff   |
|-------------------------------------------------------------|--------|---------|
| View inventory (search, category filter, status filter)     | ✅     | ✅     |
| Open item details and records                               | ✅     | ✅     |
| Stock In                                                    | ✅     | ✅     |
| Stock Out                                                   | ✅     | ✅     |
| Update expiry date                                          | ✅     | ✅     |
| Record waste                                                | ✅     | ✅     |
| Add item                                                    | ✅     | ❌     |
| Edit item information                                       | ✅     | ❌     |
| Delete item                                                 | ✅     | ❌     |
| Dashboard                                                   | ✅     | ❌     |
| Low Stock Alerts                                            | ✅     | ❌     |
| Stock History (all movements)                               | ✅     | ❌     |
| Expiry & Waste overview                                     | ✅     | ❌     |
| AI Inventory Intelligence                                   | ✅     | ❌     |
| Staff Management                                            | ✅     | ❌     |
| Settings (restaurant, currency, tracking)	                  | ✅     | ❌     |
| Export ML data (JSON)                                       | ✅     | ❌     |
| Reset demo data                                             | ✅     | ❌     |

On first launch the app asks you to choose a role from the Menu: Owner (full system access) or Staff (daily inventory operations).

**Part 1 – Owner**
The Owner workspace has full system access. The sidebar contains eight pages.

1. Dashboard
An inventory overview for the restaurant, showing the total number of items and summary cards. Clicking a card jumps to the matching filtered view in Inventory.

2. Inventory
- Visual grid of all items with photos.
- Search by item name, filter by category, and quick status chips: All Items, Out of Stock, Low Stock, Expiring Soon.
- Add Item button to create new ingredients.
- Edit Item inside each item page.
- Delete Item: long-press a card (or hover) to show the red × button, then confirm with Yes, Delete.

Each item stores:
i)   Item name, category, unit, supplier and optional image URL
ii)  Current quantity and minimum stock level
iii) Unit cost
iv)  Expiry date (optional, but required for AI prediction)
v)   Expiry and waste tracking settings

3. Item Details
Each item has a detail page with tabs:
a. Details: category, unit, minimum stock, supplier, unit cost, expiry date and an inventory status bar.
b. Stock In Records
c. Stock Out Records
d. Stock Adjustment Records (stock taking and adjustments)
e. Expiry & Waste: expiry information, waste records and tracking settings.

Action buttons: + Stock In, − Stock Out, Update Expiry, + Record Waste.

4. Low Stock Alerts
Lists every item at or below its minimum stock level, with current stock, minimum stock and status, so the owner knows what to reorder.

5. Stock History
A complete, filterable log of all stock movement and adjustments. Filter by item, record type (Stock In, Stock Out, Stock Taking, Stock Adjustment, Expiry Update, Item Updated) and date range (from/to). Every record shows who made the change and when.

6. Expiry & Waste
i)   Summary cards: expiring soon, expired items, estimated expired stock value and recorded waste value.
ii)  Expiry Records table showing each item, its stock, expiry date and status (Expired, Expiring Soon, Safe).
iii) Waste Records with reasons such as Spoiled, Expired, Spillage, Damaged, Over-prepared and Other.
iv)  Expiry Outcome History: confirm what actually happened to stock at expiry (for example remaining or discarded). These confirmed outcomes are what the AI learns from.

7. AI Inventory Intelligence
See AI Inventory Intelligence below. Shows the model status, prediction data requirements and the expiry risk and predicted remaining stock for each item.

8. Staff Management
- View all staff members with name, username, status and role.
- Add Staff and Disable / Activate a staff member.
- This page is a demo: it manages sample staff records only. Real invitations, passwords and authentication need a secure backend.
  
9. Settings
a. Restaurant Settings: restaurant name and currency (RM, SGD, USD).
b. Expiry & Waste Settings: the Expiring Soon threshold in days.
c. ML Data Collection: counts for the Synthetic / Demo dataset and the User / Operational dataset, plus Export ML Data (JSON).
d. Data & Privacy information.
e. Reset Demo Data.

**Part 2 – Staff**
The Staff workspace is deliberately simple, so busy kitchen teams can record stock in a few taps. Staff only see the Inventory page.

What staff can do
1. Browse inventory: search by name, filter by category, and use the status chips (All Items, Out of Stock, Low Stock, Expiring Soon).
2. Open an item to see its current quantity, status, supplier, unit cost, minimum stock and expiry date.
3. Stock In: record a purchase or delivery with quantity, date, reason (for example Purchase / Received) and optional notes.
4. Stock Out: record usage with a reason such as Kitchen usage, Transfer or Supplier return.
5. Update Expiry: set or change an item's expiry date.
6. Record Waste: log discarded stock with quantity and a required waste reason (when waste tracking is enabled for that item).
7. See a confirmation message after each action, for example Stock In recorded successfully.

Every action is saved with the staff member's name and a timestamp, so the owner can audit it in Stock History.

What staff cannot do
1. Add, edit or delete items. The app shows Only Owner can edit item information or Only Owner can delete items.
2. Open the Dashboard, Low Stock Alerts, Stock History, Expiry & Waste, AI Inventory Intelligence, Staff Management or Settings.
3. Export ML data. The app shows Only Owner can export ML data.

**Tip for good AI predictions**
Mark stock-outs that are normal kitchen usage as Kitchen usage. The AI needs at least 3 of these per item before it shows a prediction.

**AI Inventory Intelligence**
StockPilot embeds two Random Forest models that run locally in the browser:

Model	                     |           Type	         | Trees |                         Purpose
Expiry Risk Classifier     | RandomForestClassifier	 |  150	 | Probability that stock is still left when it expires
Predicted Remaining Stock	 | RandomForestRegressor	 |  350	 | Expected quantity left at expiry

**When a prediction appears**
- The item has a future expiry date and expiry tracking is on.
- The item has at least 3 stock-outs marked as Kitchen usage. Below this, the app shows an insufficient data status instead of a fake number.
- Predictions refresh automatically after each stock action: Stock In, Stock Out, Stock Taking, Stock Adjustment, Waste, item edit or tracking change.

**Automatic on-device retraining (V10)**
- Triggered when a new confirmed expiry outcome is recorded, and checked again when AI Inventory Intelligence is opened.
- Needs at least 12 item/expiry cohorts, with at least 3 examples in each class.
- A candidate model replaces the current one only if it validates better on a held-out set (better Brier score without a worse F1 for the classifier, lower MAE for the regressor). Otherwise the previous model is kept.
- Labels come only from observed expiry outcomes. Model predictions are never used as training labels.
- The accepted model is saved in the browser's localStorage.

**Honest accuracy note**
The shipped models were trained on 2,280 synthetic scenarios. On the synthetic hold-out set (480 scenarios), the classifier reached F1 0.903 / ROC-AUC 0.971 and the regressor MAE 0.692 / R² 0.844. These figures are not real restaurant accuracy. Real validation needs confirmed usage, waste and expiry outcomes from real kitchens.

**Tech Stack**
- Frontend: React 19, Vite, TypeScript, Tailwind CSS, Lucide icons, Motion
- App core: a self-contained HTML/JavaScript application at public/stockpilot/index.html, loaded inside the React shell via an iframe
- ML: Random Forest models converted to JavaScript data, with browser-native CART + bootstrap Random Forest training for retraining
- Storage: browser localStorage
- Built with: Google AI Studio
  
**Project Structure**
stockpilot-ai-f-b-inventory/
├── index.html                 # Vite entry page
├── metadata.json              # App name and description
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── src/
│   ├── main.tsx               # React entry
│   ├── App.tsx                # Loads the StockPilot app in an iframe
│   └── index.css
└── public/
    ├── stockpilot/
    │   └── index.html         # The full StockPilot application
    └── assets/aistudio/
        └── StockPilot_ML_Auto_Retrain_V10_*.zip   # Standalone offline ML build

Run Locally
Prerequisite: Node.js

# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:3000)
npm run dev

Other scripts:
npm run build     # Production build
npm run preview   # Preview the production build
npm run lint      # Type-check

Standalone mode: you can also unzip the file in public/assets/aistudio/ and open StockPilot_Local_ML/index.html directly in Chrome, Edge or Safari. No installation is needed.

| The GEMINI_API_KEY entry in .env.example comes from the AI Studio template. The StockPilot app itself does not need it, because its AI runs locally.

**Data Storage & Privacy**
- All inventory data and the trained model are stored in your own browser's localStorage.
- No data is sent to a server, and no ML API key is needed.
- Data is not shared between devices or users. Clearing browser site data can delete your records, so use Export ML Data (JSON) to back up.
- The export separates Synthetic / Demo records (syntheticDemoDataset) from User / Operational records (operationalDataset).

**Limitations**
- Prototype, not production. There is no shared cloud database, so staff on different devices do not see the same stock.
- Role selection is a demo. There is no real login or authentication, and the Staff Management page manages sample records only.
- Synthetic training data. Accuracy on real restaurants has not been validated.
- Category coverage. The model is trained on Dairy, Fruits, Meat and Vegetables. Other categories use a neutral fallback, so their predictions are exploratory.
- Expiry Risk is a proxy. It estimates the chance that stock is left at expiry, not exactly how much food will be thrown away.
  
Roadmap
[ ] Secure authentication and real staff invitations
[ ] Shared cloud database with multi-device sync
[ ] Supplier ordering and reorder suggestions
[ ] Validation on real restaurant data
[ ] Reports and CSV/PDF export
[ ] Mobile-optimised staff view
[ ] Support for more languages
