import { Injectable } from "@angular/core";
import { Apollo, gql } from "apollo-angular";
import { Observable, map } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(private apollo: Apollo) {}

    get<T>(query: string): Observable<T> {
        return this.apollo.query<T>({ query: gql`${query}` })
            .pipe(map(x => x.data));
    }
}