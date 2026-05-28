// =============================================================================
// SOLUTION 28 — ViewChild Generic Typing
// =============================================================================
//
// Every change is annotated `// FIX #n`. Give every Query the right
// element/template type — Angular doesn't infer it from the
// template-reference variable alone.
// =============================================================================

import { AfterViewInit, Component, ElementRef, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';

@Component({ selector: 'app-child', standalone: true, template: `<p>child</p>` })
export class ChildComponent { greet() { return 'hi'; } }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ChildComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <input #input />
      <p>typed: {{ value }}</p>
      <app-child #c></app-child>
      <ng-template #t>tmpl</ng-template>
      <div #rowRef>row</div>
    </main>
  `,
})
export class AppComponent implements AfterViewInit {
  // FIX #1: typed ElementRef so nativeElement.value is a real string.
  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  value = '';

  // FIX #2: field type matches the `read:` option. To grab the TemplateRef,
  //         the field IS a TemplateRef (not the component class).
  @ViewChild('t', { read: TemplateRef }) tmpl!: TemplateRef<unknown>;

  // FIX #3: the field is QueryList<ElementRef<HTMLDivElement>> — a #ref on
  //         a plain DOM element yields an ElementRef wrapper.
  @ViewChildren('rowRef') rows!: QueryList<ElementRef<HTMLDivElement>>;

  ngAfterViewInit() {
    this.value = this.input.nativeElement.value;
  }
}
