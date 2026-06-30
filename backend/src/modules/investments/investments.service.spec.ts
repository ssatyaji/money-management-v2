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
