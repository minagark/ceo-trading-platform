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

export const PORTFOLIO_TYPES = ['RETIREMENT', 'BROKERAGE'] as const;
export const INSTRUMENT_TYPES = ['EQUITY', 'CASH', 'CRYPTO'] as const;
export const SIDES = ['BUY', 'SELL', 'DEPOSIT'] as const;
export const ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'FULFILLED', 'CANCELLED'] as const;

export type PortfolioType = typeof PORTFOLIO_TYPES[number];
export type InstrumentType = typeof INSTRUMENT_TYPES[number];
export type Side = typeof SIDES[number];
export type OrderStatus = typeof ORDER_STATUSES[number];

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
