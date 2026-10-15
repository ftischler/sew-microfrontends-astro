import { Component, signal, VERSION } from '@angular/core';

@Component({
  selector: 'mfe2-home',
  template: `
    <h2>Microfrontend 2</h2>
    <p>Angular {{ angularVersion }} island, hydrated when it scrolls into view.</p>
    <button type="button" (click)="clicks.update((count) => count + 1)">
      Clicked {{ clicks() }} times
    </button>
  `,
})
export class Mfe2Home {
  protected readonly angularVersion = VERSION.full;
  protected readonly clicks = signal(0);
}
