// interface for a widget on the home page
import { ComponentDecorator, Type } from '@angular/core';
import { Account } from '../../accounts-list/accounts-list';

export interface Widget {
    id: string;
    label: string;
    content: Type<unknown>; // unknown since the content of each widget will be a different type of component
    inputs?: Record<string, any>; // to be able to pass input variables to components
    route?: string; // optional route for the "View All" link in the widget
    selectedAccount?: Account | null // optional selection for selected account
}