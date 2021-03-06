/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  AfterContentInit,
  Attribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { merge, of as observableOf, Subscription } from 'rxjs';
import { SatDatepicker } from './datepicker';
import { SatDatepickerIntl } from './datepicker-intl';

/** Can be used to override the icon of a `matDatepickerToggle`. */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[matDatepickerToggleIcon]'
})
// tslint:disable-next-line: directive-class-suffix
export class SatDatepickerToggleIcon {}

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'sat-datepicker-toggle',
  templateUrl: 'datepicker-toggle.html',
  styleUrls: ['datepicker-toggle.css'],
  // tslint:disable-next-line: use-host-property-decorator
  host: {
    class: 'mat-datepicker-toggle',
    // Always set the tabindex to -1 so that it doesn't overlap with any custom tabindex the
    // consumer may have provided, while still being able to receive focus.
    '[attr.tabindex]': '-1',
    '[class.mat-datepicker-toggle-active]': 'datepicker && datepicker.opened',
    '[class.mat-accent]': 'datepicker && datepicker.color === "accent"',
    '[class.mat-warn]': 'datepicker && datepicker.color === "warn"',
    '(focus)': '_button.focus()'
  },
  exportAs: 'matDatepickerToggle',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SatDatepickerToggle<D> implements AfterContentInit, OnChanges, OnDestroy {
  private _stateChanges = Subscription.EMPTY;

  /** Datepicker instance that the button will toggle. */
  @Input('for') datepicker: SatDatepicker<D>;

  /** Tabindex for the toggle. */
  @Input() tabIndex: number | null;

  /** Whether the toggle button is disabled. */
  @Input()
  get disabled(): boolean {
    if (this._disabled === undefined && this.datepicker) {
      return this.datepicker.disabled;
    }

    return !!this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
  }
  private _disabled: boolean;

  /** Whether ripples on the toggle should be disabled. */
  @Input() disableRipple: boolean;

  /** Custom icon set by the consumer. */
  @ContentChild(SatDatepickerToggleIcon, { static: false }) _customIcon: SatDatepickerToggleIcon;

  /** Underlying button element. */
  @ViewChild('button', { static: true }) _button: MatButton;

  constructor(
    public _intl: SatDatepickerIntl,
    private _changeDetectorRef: ChangeDetectorRef,
    @Attribute('tabindex') defaultTabIndex: string
  ) {
    const parsedTabIndex = Number(defaultTabIndex);
    this.tabIndex = parsedTabIndex || parsedTabIndex === 0 ? parsedTabIndex : null;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datepicker']) {
      this._watchStateChanges();
    }
  }

  ngOnDestroy() {
    this._stateChanges.unsubscribe();
  }

  ngAfterContentInit() {
    this._watchStateChanges();
  }

  _open(event: Event): void {
    if (this.datepicker && !this.disabled) {
      this.datepicker.open();
      event.stopPropagation();
    }
  }

  private _watchStateChanges() {
    const datepickerDisabled = this.datepicker ? this.datepicker._disabledChange : observableOf();
    const inputDisabled =
      this.datepicker && this.datepicker._datepickerInput
        ? this.datepicker._datepickerInput._disabledChange
        : observableOf();
    const datepickerToggled = this.datepicker
      ? merge(this.datepicker.openedStream, this.datepicker.closedStream)
      : observableOf();

    this._stateChanges.unsubscribe();
    this._stateChanges = merge(this._intl.changes, datepickerDisabled, inputDisabled, datepickerToggled).subscribe(() =>
      this._changeDetectorRef.markForCheck()
    );
  }
}
