import { Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

export type InstrumentType = 'equity' | 'foreign exchange' | 'crypto';
export type OrderAction = 'buy' | 'sell';
export type OrderStatus = 'fulfilled' | 'pending' | 'cancelled' | 'rejected';

export interface Order {
  orderId: string;
  instrumentId: string;
  holdingId: string;
  instrumentType: InstrumentType;
  action: OrderAction;
  quotedPrice: number;
  actualPrice: number | null;
  amount: number;
  time: string;
  status: OrderStatus;
}

@Injectable({ providedIn: 'root' })
export class AccountActivityService {
  // Real implementation
  // orders = httpResource<Order[]>(() => '/api/orders');

  // Mock data — swap for httpResource<Order[]>(() => '/api/orders')
  // once the orders API exists (same pattern as HoldingsService / AssetsService).
  orders = signal<Order[]>([
    {
      orderId: 'a1b2c3d4-0001-4a11-8f1a-000000000001',
      instrumentId: 'inst-aapl',
      holdingId: 'hold-1',
      instrumentType: 'equity',
      action: 'buy',
      quotedPrice: 227.52,
      actualPrice: 227.55,
      amount: 10,
      time: '2026-08-29T14:32:00Z',
      status: 'fulfilled',
    },
    {
      orderId: 'a1b2c3d4-0002-4a11-8f1a-000000000002',
      instrumentId: 'inst-eurusd',
      holdingId: 'hold-2',
      instrumentType: 'foreign exchange',
      action: 'sell',
      quotedPrice: 1.0862,
      actualPrice: null,
      amount: 5000,
      time: '2026-08-30T09:05:00Z',
      status: 'pending',
    },
    {
      orderId: 'a1b2c3d4-0003-4a11-8f1a-000000000003',
      instrumentId: 'inst-btc',
      holdingId: 'hold-3',
      instrumentType: 'crypto',
      action: 'buy',
      quotedPrice: 61423.1,
      actualPrice: 61498.75,
      amount: 0.25,
      time: '2026-08-31T18:47:00Z',
      status: 'fulfilled',
    },
    {
      orderId: 'a1b2c3d4-0004-4a11-8f1a-000000000004',
      instrumentId: 'inst-nvda',
      holdingId: 'hold-4',
      instrumentType: 'equity',
      action: 'sell',
      quotedPrice: 118.11,
      actualPrice: null,
      amount: 15,
      time: '2026-09-01T11:20:00Z',
      status: 'cancelled',
    },
    {
      orderId: 'a1b2c3d4-0005-4a11-8f1a-000000000005',
      instrumentId: 'inst-gbpusd',
      holdingId: 'hold-5',
      instrumentType: 'foreign exchange',
      action: 'buy',
      quotedPrice: 1.2634,
      actualPrice: null,
      amount: 2500,
      time: '2026-09-01T16:03:00Z',
      status: 'rejected',
    },
    {
      orderId: 'a1b2c3d4-0006-4a11-8f1a-000000000006',
      instrumentId: 'inst-eth',
      holdingId: 'hold-6',
      instrumentType: 'crypto',
      action: 'sell',
      quotedPrice: 3120.4,
      actualPrice: 3118.9,
      amount: 1.5,
      time: '2026-09-02T08:15:00Z',
      status: 'fulfilled',
    },
  ]);
}
