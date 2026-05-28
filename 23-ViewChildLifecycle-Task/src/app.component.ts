// =============================================================================
// TASK 23 — ViewChild Accessed Too Early
// =============================================================================
//
// DIFFICULTY: L4 (advanced)            TARGET TIME: < 10 minutes
// TYPE: behavioral (open the console)
//
// `@ViewChild` / `@ViewChildren` are populated at distinct times in the
// lifecycle. Read them too early and you get `undefined`, an empty
// `QueryList`, or a focus() call that throws on null.
//
// GOAL: Move every ViewChild read to the right lifecycle hook and react
//       when conditionally-rendered children mount/unmount.
//
// THINGS TO SCRUTINISE:
//   1. `@ViewChild('input') input!: ElementRef<HTMLInputElement>`. By
//      default `static: false`. In ngOnInit, the view has NOT been built
//      yet — `this.input` is undefined. Use ngAfterViewInit, OR set
//      `static: true` for elements not inside structural directives.
//   2. `@ViewChildren('row') rows!: QueryList<...>`. In the constructor,
//      this is an empty QueryList. In ngAfterViewInit it has the initial
//      children; you must also subscribe to `rows.changes` to react to
//      additions/removals.
//   3. `@ViewChild(ChildComp) child!: ChildComp` where the child is gated
//      by `@if`. When the @if flips on, `this.child` was previously
//      undefined; ngAfterViewInit only fires once. You must subscribe to
//      a Query to re-run when the child appears.
//
// EXPECTED CORRECT BEHAVIOR:
//   - On first paint, "Focus" puts focus on the input.
//   - Adding/removing rows updates the rendered "row count = N".
//   - Toggling the gated child on logs the child instance reliably.
//
// ACTUAL (buggy) BEHAVIOR: Focus throws on null; row count starts at 0
//   and never updates; gated child is undefined the first time.
// =============================================================================

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';

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
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  @ViewChildren('row') rows!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild(GatedComponent) gated!: GatedComponent;

  rowsModel = [1, 2, 3];
  rowCount = 0;
  visible = false;

  constructor() {
    // BUG: ViewChildren empty in constructor; this is 0 and never updates.
    console.log('[ctor] rows =', this.rows?.length);
  }

  ngOnInit() {
    // BUG: ngOnInit is too early for ViewChild; this.input is undefined.
    console.log('[ngOnInit] input =', this.input?.nativeElement?.tagName);
  }

  ngAfterViewInit() {
    // BUG: only fires ONCE. Adding/removing rows doesn't refresh rowCount.
    //      Should subscribe to this.rows.changes.
    this.rowCount = this.rows.length;
  }

  focus() {
    // BUG: throws "Cannot read properties of undefined" until the view
    //      has been initialized. (After view init it works.)
    this.input.nativeElement.focus();
  }

  addRow() {
    this.rowsModel = [...this.rowsModel, this.rowsModel.length + 1];
  }
  removeRow() {
    this.rowsModel = this.rowsModel.slice(0, -1);
  }
}
