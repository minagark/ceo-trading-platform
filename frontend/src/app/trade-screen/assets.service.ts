import { Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Asset } from './trade-screen';

@Injectable({ providedIn: 'root' })
export class AssetsService {
  // Real implementation
  // asset = httpResource<Asset>(() => '/api/assets/current');

  // Mock data — swap for httpResource<Asset>(() => '/api/assets/current')
  // once the assets API exists (same pattern as AccountsService).
  asset = signal<Asset>({
    abbrName: 'AAPL',
    fullName: 'Apple Inc.',
    price: 227.52,
    increaseValue: 1.32,
    increasePCT: 0.0058,
    volume: 48213000,
    ask: 227.55,
    bid: 227.49,
  });
}

