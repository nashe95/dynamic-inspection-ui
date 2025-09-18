import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, take, takeUntil, tap } from 'rxjs';
import { InspectionJson, Line } from '../../models/inspection.model';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  public inspectionForm = new FormGroup({});
  public formFields: Array<{id: string, name: string, condition_options: any[]}> = [];

  private readonly http: HttpClient = inject(HttpClient);

  ngOnInit(): void {
    this.requestInspectionDataObservable(this.inspectionTypeControl.value!)
      .pipe(take(1))
      .subscribe(lines => this.renderInspectionLines(lines)); //initial json file load

    this.inspectionTypeControl.valueChanges
      .pipe(
        tap(console.log),
        takeUntil(this.destroy$),
        switchMap(jsonName => this.requestInspectionDataObservable(jsonName!))
      ).subscribe(lines => this.renderInspectionLines(lines));
  }

  private requestInspectionDataObservable(path: string): Observable<Line[]> { //TODO: to be refactored to a URL (-_-)
    return this.http.get<InspectionJson>(`../../data/${ path }.json`)
      .pipe(
        map(res => {
          return res.result.lines;
        })
      );
  }

  private renderInspectionLines(lines: Line[]): void {

    this.formFields = []; // Clear existing fields
    this.inspectionForm = new FormGroup({});

    lines.forEach(line => {
      this.inspectionForm.addControl(line.id.toString(), new FormControl(line.name));
      if (line.condition_options) {
        this.formFields.push({
          id: line.id.toString(),
          name: line.name,
          condition_options: line.condition_options
        });
      }
    });

  }

}
