# Crypto Price Auto-Fetch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to automatically fetch the live price of investment assets (Crypto, Stocks, etc.) in the Add Asset form by typing the ticker.

**Architecture:** Add a new `GET /investments/price` endpoint to the backend that resolves the price in Rupiah using the existing `MarketDataService`. Expose this endpoint in the frontend API client and bind it to the ticker input's `onBlur` event and a new "Cek Harga" button in the Add Asset form.

**Tech Stack:** NestJS, Next.js, React, TailwindCSS, TypeScript.

## Global Constraints
- Target backend directory: `backend/`
- Target frontend directory: `frontend/`
- Standard compilation check: `npx tsc --noEmit` must pass without errors on both components.

---

### Task 1: Backend Endpoint to Get Live Price

**Files:**
- Create: `backend/src/modules/investments/investments.service.spec.ts`
- Modify: `backend/src/modules/investments/investments.service.ts`
- Modify: `backend/src/modules/investments/investments.controller.ts`

**Interfaces:**
- Consumes: `MarketDataService.getPrice(ticker: string, assetType: string): Promise<number | null>`
- Produces: `GET /investments/price?ticker={ticker}&assetType={assetType}` returning `{ price: number | null }`

- [ ] **Step 1: Create the service unit test**
  Create `backend/src/modules/investments/investments.service.spec.ts`:
  ```typescript
  import { Test, TestingModule } from '@nestjs/testing';
  import { InvestmentsService } from './investments.service';
  import { MarketDataService } from './market-data.service';
  import { InvestmentsRepository } from './investments.repository';

  describe('InvestmentsService', () => {
    let service: InvestmentsService;
    let marketDataService: MarketDataService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvestmentsService,
          {
            provide: MarketDataService,
            useValue: {
              getPrice: jest.fn(),
            },
          },
          {
            provide: InvestmentsRepository,
            useValue: {},
          },
        ],
      }).compile();

      service = module.get<InvestmentsService>(InvestmentsService);
      marketDataService = module.get<MarketDataService>(MarketDataService);
    });

    it('should return live price', async () => {
      jest.spyOn(marketDataService, 'getPrice').mockResolvedValue(15000);
      const result = await service.getLivePrice('BTC', 'CRYPTO');
      expect(result).toEqual({ price: 15000 });
      expect(marketDataService.getPrice).toHaveBeenCalledWith('BTC', 'CRYPTO');
    });
  });
  ```

- [ ] **Step 2: Run the test and verify it fails**
  Run: `npm run test backend/src/modules/investments/investments.service.spec.ts`
  Expected: FAIL with "Property 'getLivePrice' does not exist on type 'InvestmentsService'"

- [ ] **Step 3: Implement `getLivePrice` in InvestmentsService**
  Add the following method to `backend/src/modules/investments/investments.service.ts`:
  ```typescript
  async getLivePrice(ticker: string, assetType: string): Promise<{ price: number | null }> {
    const price = await this.marketDataService.getPrice(ticker, assetType);
    return { price };
  }
  ```

- [ ] **Step 4: Run the test to verify it passes**
  Run: `npm run test backend/src/modules/investments/investments.service.spec.ts`
  Expected: PASS

- [ ] **Step 5: Expose the endpoint in InvestmentsController**
  Add the following imports and route handler in `backend/src/modules/investments/investments.controller.ts` (around line 22, before other routes):
  ```typescript
  import { Query } from '@nestjs/common';
  // ...
  @Get('price')
  @ApiOperation({ summary: 'Fetch live asset price' })
  getPrice(
    @Query('ticker') ticker: string,
    @Query('assetType') assetType: string,
  ) {
    return this.investmentsService.getLivePrice(ticker, assetType);
  }
  ```

- [ ] **Step 6: Run TypeScript compiler check on backend**
  Run: `npx tsc --noEmit` inside `backend` directory.
  Expected: Success without errors.

- [ ] **Step 7: Commit backend changes**
  Run:
  ```bash
  git add backend/src/modules/investments/investments.service.ts backend/src/modules/investments/investments.controller.ts backend/src/modules/investments/investments.service.spec.ts
  git commit -m "feat(backend): add getLivePrice endpoint for investment assets"
  ```

---

### Task 2: Frontend Integration and UI Updates

**Files:**
- Modify: `frontend/src/lib/api/investments.api.ts`
- Modify: `frontend/src/app/(dashboard)/investments/add/page.tsx`

**Interfaces:**
- Consumes: `GET /investments/price?ticker={ticker}&assetType={assetType}`
- Produces: Live price auto-fill in Add Asset Form

- [ ] **Step 1: Add wrapper in `investments.api.ts`**
  Modify `frontend/src/lib/api/investments.api.ts` to add the `getLivePrice` method inside `investmentsApi` object:
  ```typescript
  getLivePrice: async (ticker: string, assetType: AssetType): Promise<{ price: number | null }> => {
    const response = await apiClient.get<ApiResponse<{ price: number | null }>>('/investments/price', {
      params: { ticker, assetType },
    });
    return response.data.data;
  },
  ```

- [ ] **Step 2: Add price-fetching logic and UI controls in the Add Asset Form**
  Modify `frontend/src/app/(dashboard)/investments/add/page.tsx`:
  - Import `investmentsApi` at the top:
    ```typescript
    import { investmentsApi } from '@/lib/api/investments.api';
    ```
  - Inside `AddAssetPage` component, declare price fetching state and helper function:
    ```typescript
    const [isFetchingPrice, setIsFetchingPrice] = useState(false);

    const handleFetchLivePrice = async (tickerVal?: string) => {
      const activeTicker = tickerVal || form.ticker;
      if (!activeTicker) return;
      setIsFetchingPrice(true);
      try {
        const data = await investmentsApi.getLivePrice(activeTicker, form.assetType);
        if (data && data.price !== null) {
          setForm((prev) => ({
            ...prev,
            currentPrice: String(data.price),
          }));
          toast.success(`Harga live untuk ${activeTicker} berhasil diambil: Rp ${formatNumber(data.price)}`);
        } else {
          toast.error(`Harga live untuk ticker "${activeTicker}" tidak ditemukan.`);
        }
      } catch (err) {
        toast.error('Gagal mem-fetch harga live. Silakan masukkan harga manual.');
      } finally {
        setIsFetchingPrice(false);
      }
    };
    ```
  - Update the Ticker Input layout and binding (replace lines 105-110):
    ```tsx
    {/* Ticker */}
    <div className="space-y-2">
      <Label>Ticker / Kode (opsional)</Label>
      <div className="flex gap-2">
        <Input 
          placeholder="Contoh: BBCA.JK, BTC" 
          value={form.ticker}
          onChange={(e) => setForm({ ...form, ticker: e.target.value })}
          onBlur={() => {
            if (form.ticker && !isFetchingPrice) {
              handleFetchLivePrice();
            }
          }}
          className="flex-1"
        />
        {form.ticker && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleFetchLivePrice()}
            disabled={isFetchingPrice}
            className="gap-1 shrink-0 rounded-lg"
          >
            {isFetchingPrice ? (
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[18px]">sync</span>
            )}
            Cek Harga
          </Button>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Masukkan ticker valid (misal: `BTC` untuk crypto, `BBCA.JK` untuk saham) untuk mengambil harga live otomatis.
      </p>
    </div>
    ```

- [ ] **Step 3: Run TypeScript compiler check on frontend**
  Run: `npx tsc --noEmit` inside `frontend` directory.
  Expected: Success without errors.

- [ ] **Step 4: Commit frontend changes**
  Run:
  ```bash
  git add frontend/src/lib/api/investments.api.ts frontend/src/app/\(dashboard\)/investments/add/page.tsx
  git commit -m "feat(frontend): integrate live price auto-fetch on ticker input"
  ```
