import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Injector,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { TuiMobileCalendarDialogComponent } from '@taiga-ui/addon-mobile';
import { TuiDay, tuiReplayedValueChangesFrom } from '@taiga-ui/cdk';
import { TUI_MONTHS, TuiDialogService } from '@taiga-ui/core';
import { TUI_CALENDAR_DATA_STREAM } from '@taiga-ui/kit';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { Observable } from 'rxjs';
import { map, startWith, withLatestFrom } from 'rxjs/operators';

// @dynamic
@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private readonly control = new FormControl(new TuiDay(2024, 9, 3));

  private readonly dialog$: Observable<TuiDay>;

  readonly date$ = this.control.valueChanges.pipe(
    startWith(this.control.value),
    withLatestFrom(this.months),
    map(([value, months]) => this.getParsed(value, months))
  );

  constructor(
    @Inject(TuiDialogService) dialogService: TuiDialogService,
    @Inject(Injector) injector: Injector,
    @Inject(TUI_MONTHS) private readonly months: Observable<string[]>
  ) {
    const dataStream = tuiReplayedValueChangesFrom(this.control);
    const computedInjector = Injector.create({
      providers: [
        {
          provide: TUI_CALENDAR_DATA_STREAM,
          useValue: dataStream,
        },
      ],
      parent: injector,
    });
    const content = new PolymorpheusComponent(
      TuiMobileCalendarDialogComponent,
      computedInjector
    );

    this.dialog$ = dialogService.open(content, {
      size: 'fullscreen',
      closeable: false,
      data: {
        min: TuiDay.currentLocal(),
      },
    });
  }

  get empty(): boolean {
    return !this.control.value;
  }

  getParsed(value: TuiDay, months: string[]): string {
    if (!value) {
      return 'Choose a date';
    }

    const { month, day, year } = value;

    return `${months[month]} ${day}, ${year}`;
  }

  onClick(): void {
    this.dialog$.subscribe((value) => {
      this.control.setValue(value);
    });
  }
}
