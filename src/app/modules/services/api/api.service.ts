import { Injectable } from "@angular/core";
import { CellValue } from "@app/models";
import { Apollo, gql } from "apollo-angular";
import { Observable, map } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private apollo: Apollo) {}

    get<T>(query: string): Observable<T> {
        return this.apollo.query<T>({ query: gql`${query}` })
            .pipe(map(x => x.data));
    }

    getExcelFileBase64(cellValues: CellValue[]): Observable<string> {
        //add validation for duplicate keys
        cellValues = cellValues.filter((x, idx) =>
            cellValues.findIndex(y => y.key === x.key) === idx);

        var cellValuesString = JSON.stringify(cellValues)
            .replaceAll('"key"', 'key')
            .replaceAll('"value"', 'value');
        const query = `{ excelFileBase64(cellTextDict: ${cellValuesString}) }`;

        return this.apollo.query<{ excelFileBase64: string }>({ query: gql`${query}` })
            .pipe(map(x => x.data.excelFileBase64));
    }
}