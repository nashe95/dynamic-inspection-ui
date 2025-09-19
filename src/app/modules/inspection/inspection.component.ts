import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, switchMap, take, takeUntil, tap } from 'rxjs';
import { InspectionFormField, InspectionJson, Line } from '../../models/inspection.model';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HasObservablesDirective } from '../../directives/has-observables.directive';
import { AsyncPipe } from '@angular/common';
import { evaluateConditionFn } from './helpers';

@Component({
  selector: 'app-inspection',
  imports: [
    ReactiveFormsModule,
    AsyncPipe
  ],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.scss'
})
export class InspectionComponent extends HasObservablesDirective implements OnInit {

  public inspectionTypes$: Observable<Array<{id: string, name: string}>> = of([]);
  public inspectionTypeControl = new FormControl<string>('rental_quality_check_inspection');
  public inspectionForm = new FormGroup({});
  public formFields: Array<InspectionFormField> = [];

  private readonly http: HttpClient = inject(HttpClient);

  ngOnInit(): void {
    //@TODO: inspection types to be pulled from API when available
    this.inspectionTypes$ = of([
      {id: 'rental_quality_check_inspection', name: 'Rental Quality Check'},
      {id: 'site_inspection', name: 'Site Inspection'},
      {id: 'supplier_inspection', name: 'Supplier Inspection'},
    ]);
    //load inspection lines (form fields)
    this.requestInspectionDataObservable(this.inspectionTypeControl.value!)
      .pipe(take(1))
      .subscribe(lines => this.renderInspectionLines(lines)); //initial json file load
    this.inspectionTypeControl.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        switchMap(jsonName => this.requestInspectionDataObservable(jsonName!))
      ).subscribe(lines => this.renderInspectionLines(lines));
  }

  public shouldShowField(field: any): boolean {
    if (!field.dependsOn) return true;

    const dependsOnControl = this.inspectionForm.get(field.dependsOn);
    if (!dependsOnControl) return true;

    // Show if the field it depends on has a value
    return !!dependsOnControl.value;
  }

  public isFieldInvalid(field: any): boolean | undefined {
    const control = this.inspectionForm.get(field.id);
    return control?.invalid && (control?.dirty || control?.touched);
  }

  public getFieldValue(field: any): any {
    return this.inspectionForm.get(field.id)?.value;
  }

  public onFileSelected(event: Event, fieldId: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    const currentImages = this.inspectionForm.get(fieldId)?.value || [];
    const maxImages = this.formFields.find(f => f.id === fieldId)?.maxPictures || 1;

    // Check if adding these files would exceed the maximum allowed
    if (currentImages.length + files.length > maxImages) {
      alert(`You can only upload a maximum of ${maxImages} images`);
      return;
    }

    const newImages:Array<{ file: File; preview: string; }> = [];

    for (const file of files) {
      if (!file.type.match('image.*')) {
        alert(`File ${file.name} is not an image`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        newImages.push({
          file: file,
          preview: e.target.result
        });

        // Update form control when all files are processed
        if (newImages.length === files.length) {
          this.inspectionForm.patchValue({
            [fieldId]: [...currentImages, ...newImages]
          });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  public removeImage(fieldId: string, index: number): void {
    const currentImages = [...(this.inspectionForm.get(fieldId)?.value || [])];
    currentImages.splice(index, 1);
    this.inspectionForm.patchValue({
      [fieldId]: currentImages
    });
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

    this.formFields = [];
    this.inspectionForm = new FormGroup({});

    // First pass: create all fields
    lines.forEach(line => {
      const fieldId = line.id.toString();
      const fieldContext = { severity_level: 0 }; // Will be updated when conditions change

      // Add condition field
      if (line.condition_options?.length) {
        this.formFields.push({
          id: `${fieldId}_condition`,
          name: line.name,
          type: 'condition',
          required: line.field_requirement === 'required',
          condition_options: line.condition_options,
          line: line // Store the full line for reference
        });

        const control = new FormControl('', line.field_requirement === 'required' ? [Validators.required] : []);
        this.inspectionForm.addControl(`${fieldId}_condition`, control);

        // Update context when condition changes
        control.valueChanges.subscribe(value => {
          fieldContext.severity_level = Number(value) || 0;
          this.updateConditionalFields();
        });
      }

      // Add pictures field if needed
      if (line.pic_requirement !== 'none') {
        this.formFields.push({
          id: `${fieldId}_pictures`,
          name: `${line.name} - Pictures`,
          type: 'pictures',
          required: false, // Will be set by condition
          maxPictures: line.num_pics || 1,
          picRequirement: line.pic_requirement,
          picRequirementCondition: line.pic_requirement_condition,
          dependsOn: `${fieldId}_condition`,
          line: line
        });
        this.inspectionForm.addControl(`${fieldId}_pictures`, new FormControl([]));
      }

      // Add notes field if needed
      if (line.note_requirement !== 'none') {
        this.formFields.push({
          id: `${fieldId}_notes`,
          name: `${line.name} - Notes`,
          type: 'notes',
          required: false, // Will be set by condition
          noteRequirement: line.note_requirement,
          noteRequirementCondition: line.note_requirement_condition,
          dependsOn: `${fieldId}_condition`,
          line: line
        });
        this.inspectionForm.addControl(`${fieldId}_notes`, new FormControl(''));
      }
    });

    // Initial update of conditional fields
    this.updateConditionalFields();

  }

  // Method to update field states based on conditions
  private updateConditionalFields(): void {
    this.formFields.forEach(field => {
      if (field.dependsOn) {
        const dependsOnControl = this.inspectionForm.get(field.dependsOn);
        if (dependsOnControl) {
          const context = {
            severity_level: Number(dependsOnControl.value) || 0
          };

          if (field.type === 'pictures' && field.picRequirementCondition) {
            const isRequired = evaluateConditionFn(
              field.picRequirementCondition,
              context
            );
            field.required = isRequired;
            const control = this.inspectionForm.get(field.id);
            if (isRequired) {
              control?.addValidators(Validators.required);
            } else {
              control?.clearValidators();
            }
            control?.updateValueAndValidity();
          }

          if (field.type === 'notes' && field.noteRequirementCondition) {
            const isRequired = evaluateConditionFn(
              field.noteRequirementCondition,
              context
            );
            field.required = isRequired;
            const control = this.inspectionForm.get(field.id);
            if (isRequired) {
              control?.addValidators(Validators.required);
            } else {
              control?.clearValidators();
            }
            control?.updateValueAndValidity();
          }
        }
      }
    });
  }

}
