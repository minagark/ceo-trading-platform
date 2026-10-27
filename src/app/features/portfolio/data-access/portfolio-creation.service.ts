import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PortfolioCreationService {
  private portfolioDataSubject = new BehaviorSubject<any>(null);
  portfolioData$ = this.portfolioDataSubject.asObservable();

  setPortfolioData(data: any) {
    this.portfolioDataSubject.next(data);
  }

  getPortfolioData() {
    return this.portfolioDataSubject.getValue();
  }
  constructor() {}
}