// interface for a widget on the home page
import { Type} from '@angular/core';

export interface Widget {
    id: string;
    label: string;
    content: Type<unknown>; // unkown since the content of each widget will be a different type of component
}