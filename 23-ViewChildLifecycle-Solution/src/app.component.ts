// =============================================================================
// SOLUTION 23 — ViewChild Accessed Too Early
// =============================================================================
//
// Every change is annotated `// FIX #n`. Lifecycle for queries:
//   - constructor / ngOnInit:  queries are EMPTY (undefined / empty list).
//   - ngAfterViewInit:         queries are populated for the first time.
//   - QueryList.changes:       subscribe to react to additions/removals
//                              (and to children that appear later via @if).
// For an element that is always present, `{ static: true }` makes it
// available in ngOnInit.
// =============================================================================

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({ selector: 'app-gated', standalone: true, template: `<p>gated child #{{ n }}</p>` })
export class GatedComponent { n = Math.floor(Math.random() * 1000); }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GatedComponent],
  template: `
    <main style="font-family: system-ui; padding: 24px;">
      <h1>ViewChild Lifecycle</h1>
      <input #input placeholder="will be focused" />
      <button (click)="focus()">Focus</button>
      <div>
        <button (click)="addRow()">Add row</button>
        <button (click)="removeRow()">Remove row</button>
        @for (r of rowsModel; track r) { <p #row>row {{ r }}</p> }
        <p>row count (via @ViewChildren) = {{ rowCount }}</p>
      </div>
      <hr />
      <button (click)="visible = !visible">Toggle gated</button>
      @if (visible) { <app-gated /> }
    </main>
  `,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  // FIX #1: static:true so this.input is set before ngOnInit. The element
  //         is not inside any structural directive, so it's safe.
  @ViewChild('input', { static: true }) input!: ElementRef<HTMLInputElement>;
  @ViewChildren('row') rows!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren(GatedComponent) gatedQuery!: QueryList<GatedComponent>;

  rowsModel = [1, 2, 3];
  rowCount = 0;
  visible = false;
  private rowsSub?: Subscription;
  private gatedSub?: Subscription;

  ngOnInit() {
    // FIX #1 (works): with static:true the element is available here.
    console.log('[ngOnInit] input =', this.input.nativeElement.tagName);
  }

  ngAfterViewInit() {
    this.rowCount = this.rows.length;

    // FIX #2: subscribe to the QueryList's changes notifier; it emits
    //         whenever children are added or removed.
    this.rowsSub = this.rows.changes.subscribe(() => (this.rowCount = this.rows.length));

    // FIX #3: use @ViewChildren (a live QueryList) and watch .changes so
    //         the gated child is observable even when it appears later
    //         via @if. (@ViewChild alone fires only at first AfterViewInit.)
    this.gatedSub = this.gatedQuery.changes.subscribe((q) =>
      console.log('[gated] now =', q.first?.n ?? null),
    );
  }

  ngOnDestroy() {
    this.rowsSub?.unsubscribe();
    this.gatedSub?.unsubscribe();
  }

  focus() {
    // FIX #1 (works): static:true means the input is populated before
    //         any event handler can possibly fire.
    this.input.nativeElement.focus();
  }

  addRow() { this.rowsModel = [...this.rowsModel, this.rowsModel.length + 1]; }
  removeRow() { this.rowsModel = this.rowsModel.slice(0, -1); }
}
