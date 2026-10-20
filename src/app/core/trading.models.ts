export interface Portfolio {
  ID: string;
  holdingIds: string[];
  type: PortfolioType;
}

export interface Holding {
  holdingId: string;
  dateCreated: string;
  instrumentId: string;
  instrumentSymbol: string;
  instrumentName: string;
  instrumentType: InstrumentType;
  orderId: string;
  purchasedPrice: number;
  quantity: number;
}

export type PortfolioType = 'RETIREMENT' | 'BROKERAGE';
export type InstrumentType = 'EQUITY' | 'CASH' | 'CRYPTO';
export type Side = 'BUY' | 'SELL' | 'DEPOSIT';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'FULFILLED' | 'CANCELLED';

export interface OrderRequest {
  clientId: string;
  clientName: string;
  portfolioId: string;
  addInstrumentSymbol: string;
  subtractInstrumentSymbol: string;
  quantity: number;
  quotedPrice: number;
  side: Side;
  changeThreshold: number;
  market: string;
}

export interface OrderResponse {
  orderId: string;
  clientId: string;
  portfolioId: string;
  addInstrumentSymbol: string;
  addInstrumentType: InstrumentType;
  addInstrumentFullName: string;
  subtractInstrumentSymbol: string;
  subtractInstrumentType: InstrumentType;
  subtractInstrumentFullName: string;
  quantity: number;
  quotedPrice: number;
  side: Side;
  changeThreshold: number;
  createdDate: string;
  resolvedDate: string;
  currentStatus: OrderStatus;
}
