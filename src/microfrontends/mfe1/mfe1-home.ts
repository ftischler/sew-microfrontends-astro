import { Component, signal, VERSION } from '@angular/core';

@Component({
  selector: 'mfe1-home',
  template: `
    <h2>Microfrontend 1</h2>
    <p>Angular {{ angularVersion }} island, hydrated when it scrolls into view.</p>
    <button type="button" (click)="clicks.update((count) => count + 1)">
      Clicked {{ clicks() }} times
    </button>
  `,
})
export class Mfe1Home {
  protected readonly angularVersion = VERSION.full;
  protected readonly clicks = signal(0);
}
