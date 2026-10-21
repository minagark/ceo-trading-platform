import { InstrumentType, OrderStatus } from './trading.models';

export interface OrderStatusEvent {
  orderId: string;
  clientId: string;
  portfolioId: string;
  status: OrderStatus;
  message: string;
  statusDate: string;
  createdDate: string;
}

export interface QuoteSubscriptionRequest {
  symbol: string;
  type: InstrumentType;
}

export interface QuoteUpdateEvent {
  requestedSymbol: string;
  instrumentType: InstrumentType;
  marketSymbol: string;
  price: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  previousClose: number;
  currency: string;
  asOf: string;
  marketState: string;
}
