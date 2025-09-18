import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { InspectionJson } from '../../models/inspection.model';

@Component({
  selector: 'app-inspection',
  imports: [],
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.scss'
})
export class InspectionComponent implements OnInit {

  private readonly http: HttpClient = inject(HttpClient);

  ngOnInit(): void {
    this.http.get<InspectionJson>('../../data/rental_quality_check_inspection.json')
      .pipe(
        map((res: any) => {
          return res.result.lines;
        })
      ).subscribe((res) => console.log(res));
  }

}
