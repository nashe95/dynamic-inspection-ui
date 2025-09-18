import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, take, takeUntil, tap } from 'rxjs';
import { InspectionJson, Line } from '../../models/inspection.model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HasObservablesDirective } from '../../directives/has-observables.directive';

@Component({
  selector: 'app-inspection',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.scss'
})
export class InspectionComponent extends HasObservablesDirective implements OnInit {

  public inspectionTypeControl = new FormControl<string>('rental_quality_check_inspection');

  private readonly http: HttpClient = inject(HttpClient);

  ngOnInit(): void {
    this.requestInspectionDataObservable(this.inspectionTypeControl.value!).pipe(take(1)).subscribe(); //initial json file load

    this.inspectionTypeControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        switchMap(jsonName => this.requestInspectionDataObservable(jsonName!))
      ).subscribe();
  }

  private requestInspectionDataObservable(path: string): Observable<Line[]> { //TODO: to be refactored to a URL (-_-)
    return this.http.get<InspectionJson>(`../../data/${ path }.json`)
      .pipe(
        map(res => {
          return res.result.lines;
        })
      );
  }

}
