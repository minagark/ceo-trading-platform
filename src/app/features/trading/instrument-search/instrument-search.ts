import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NON_DEPOSIT_ORDER_TYPES, NonDepositOrderType, ORDER_TYPES, OrderType } from '../../../core/trading.models';
import { MatInputModule } from '@angular/material/input';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { Router } from '@angular/router';
import { MatAnchor } from '@angular/material/button';

@Component({
  imports: [
    MatLabel,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatAnchor
],
  selector: 'app-instrument-search',
  styleUrl: './instrument-search.css',
  templateUrl: './instrument-search.html',
})
export class InstrumentSearch {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly NON_DEPOSIT_ORDER_TYPES = NON_DEPOSIT_ORDER_TYPES;
  readonly INSTRUMENT_TYPE_NAMES: {[K in NonDepositOrderType]: string} = {
    US_EQUITY: "US Stocks", INDIA_EQUITY: "India Stocks",
    CRYPTO: "Cryptocurrency", FOREX: "Currencies",
  }
  instrumentSearchForm = this.fb.group({
    orderType: this.fb.control<NonDepositOrderType>('US_EQUITY'),
    symbol: this.fb.control(''),
  })
  readonly formState = toSignal(
    this.instrumentSearchForm.valueChanges.pipe(
      startWith(this.instrumentSearchForm.getRawValue()),
    ),
    {
      initialValue: this.instrumentSearchForm.getRawValue(),
    },
  );
  searchDisplay = computed(() => {
    const type = this.formState().orderType;
    if (type) {
      return "Search " + this.INSTRUMENT_TYPE_NAMES[type];
    } else {
      return "(choose a category)";
    }
  })

  submit() {
    const { orderType, symbol } = this.formState();
    if (!symbol) {
      return;
    }

    this.router.navigate(['/trades'], {
      queryParams: {
        symbol: symbol, 
        type: orderType,
      }
    })
  }
}
