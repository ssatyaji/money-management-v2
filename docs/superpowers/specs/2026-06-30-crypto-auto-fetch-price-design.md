# Design Spec: Live Asset Price Auto-Fetch in Add/Edit Asset Form

This design specification details the implementation of a live price fetch feature for investment assets (Crypto, Stocks, etc.) during input creation. This enhances user experience by automatically populating current asset prices in Rupiah (IDR) using live market data.

## Objectives
- Allow users to verify tickers/codes instantly in the Add Asset form.
- Auto-populate the "Harga Saat Ini" (Current Price) input field in Rupiah.
- Reduce manual calculations and errors by automatically resolving prices.

---

## Proposed Changes

### Backend Component

#### [MODIFY] [investments.controller.ts](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/investments/investments.controller.ts)
Expose a new `GET /investments/price` endpoint to query live market prices.
- Method: `GET`
- Route: `/price`
- Query Parameters:
  - `ticker` (string, required)
  - `assetType` (AssetType enum, required)

#### [MODIFY] [investments.service.ts](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/backend/src/modules/investments/investments.service.ts)
Expose a method `getLivePrice(ticker: string, assetType: string)` that delegates to `MarketDataService.getPrice` and returns the resolved price in IDR.

---

### Frontend Component

#### [MODIFY] [investments.api.ts](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/lib/api/investments.api.ts)
Add a function `getLivePrice(ticker: string, assetType: AssetType): Promise<{ price: number | null }>` to call the new backend endpoint.

#### [MODIFY] [add/page.tsx](file:///c:/Users/ssatyaji/Desktop/development/money-management-v2/frontend/src/app/(dashboard)/investments/add/page.tsx)
- Integrate automatic fetch on the `onBlur` event of the Ticker input field.
- Add a "Cek Harga" (Check Price) action button next to the Ticker input field.
- Add a loading state / spinner indicator while fetching.
- Update `form.currentPrice` state and display a success toast using `sonner` when a valid price is retrieved.

---

## Verification Plan

### Automated Verification
- Verify that the backend builds and tests pass successfully (`npm run build` / `npx tsc --noEmit`).
- Verify that the frontend builds and compiles correctly.

### Manual Verification
- Navigate to the "Tambah Aset" page.
- Choose "Crypto" asset type.
- Type `BTC` in the Ticker field.
- Press tab / blur the input or click "Cek Harga".
- Verify that "Harga Saat Ini (Rp)" is populated with the live BTC price (e.g. ~Rp 1.070.000.000) and a success toast is shown.
- Repeat the test with stablecoins like `USDT` (which should populate with the current live USD to IDR rate, e.g. ~Rp 17.914).
