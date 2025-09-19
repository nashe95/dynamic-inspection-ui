import { Directive, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

@Directive({
  selector: '[appHasObservables]'
})
export class HasObservablesDirective implements OnDestroy {

  protected subscription?: Subscription;
  protected subscriptions: Subscription[] = [];
  protected destroy$ = new Subject<void>();

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.subscription && !this.subscription.closed) {
      this.subscription.unsubscribe();
    }

    if (this.subscriptions.length) {
      this.subscriptions.forEach((subscription) => {
        if (subscription && !subscription.closed) {
          subscription.unsubscribe();
        }
      });
    }
  }

}
