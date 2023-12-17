import { Injectable } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { merge } from 'lodash';
import { ExpressionResult, QueryConfigExpressions, QueryResult, IndexStructure } from '@app/models';
import { RegularExpressions } from '@app/constants';
import { GraphQLQueryBuilder, ApiService, DataAccessor, DataExpressionHelpers, IndexStructureService, ExpressionEvaluator } from '@app/services';

@Injectable({ providedIn: 'root' })
export class QueryConfigExpressionEvaluator {
    constructor(private apiService: ApiService) {}

    evaluate(expressions: QueryConfigExpressions[]): Observable<QueryResult> {
        return expressions.reduce(
            (result, queryExpressions) => {
                return result.pipe(
                    switchMap(r =>
                        this.evaluateExpressionsAndRunQueries(queryExpressions, r).pipe(
                            map(x => ({
                                data: merge(r.data, x.data),
                                indexStructure: IndexStructureService.append(r.indexStructure, x.indexStructure),
                                dataPathByAlias: { ...r.dataPathByAlias, ...x.dataPathByAlias }
                            } as QueryResult))
                        )
                    )
                );
            },
            of({ data: {}, indexStructure: [], dataPathByAlias: {} } as QueryResult)
        );
    }

    private evaluateExpressionsAndRunQueries(queryExpressions: QueryConfigExpressions, prevQueryResult: QueryResult): Observable<QueryResult> {
        const expressionResults = ExpressionEvaluator.evaluate(queryExpressions.expressions, prevQueryResult);
        const readyQueries = this.applyExpressionResults(queryExpressions.query, expressionResults);

        return this.runQueries(readyQueries)
            .pipe(
                map(data => {
                    const dataPathByAlias = this.buildDataPathByAlias(queryExpressions.alias, readyQueries);
                    let indexStructure: IndexStructure = [];

                    if (queryExpressions.index) {     
                        const arrayData: unknown[][] = readyQueries
                            .map(q => DataAccessor.getDataByPath(q, data))
                            .filter(d => Array.isArray(d));

                        arrayData.forEach(x => {
                            const newStructure = IndexStructureService.build(queryExpressions.index as string, x);
                            indexStructure = IndexStructureService.append(indexStructure, newStructure);
                        });
                    }

                    return { data, indexStructure, dataPathByAlias } as QueryResult;
                })
            );
    }

    // query: 'coinCodex.{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
    // alias: predictions
    // index: 'predictionIdx'
    private runQueries(sameConfigReadyQueries: string[]): Observable<unknown> {
        const queryWithExpression = sameConfigReadyQueries.find(q =>
            RegularExpressions.expression.test(q));
        if (queryWithExpression) {
            throw new Error(`It's impossible to run query with expressions. Evaluate query expressions first. Query: ${queryWithExpression}`);
        }

        const graphQLQuery = GraphQLQueryBuilder.buildQuery(sameConfigReadyQueries);

        return this.apiService.get(graphQLQuery);
    }

    private applyExpressionResults(textWithExpressions: string, expressionResults: ExpressionResult[]): string[] {
        return expressionResults
            .reduce(
                (texts, exprRes) => {
                    return texts.flatMap(t => 
                        exprRes.result.map(r =>
                            DataExpressionHelpers.replaceExpression(t, exprRes.expression, r)));
                },
                [textWithExpressions] as string[]
            )
            .map(x =>
                x.replaceAll('{{', '').replaceAll('}}', ''));
    }

    private buildDataPathByAlias(alias: string, sameConfigReadyQueries: string[]): { [alias: string]: string } {
        return sameConfigReadyQueries.length === 1
            ? { [alias]: sameConfigReadyQueries[0] }
            : sameConfigReadyQueries.reduce(
                (res, query, idx) =>
                    ({ ...res, [`${alias}[${idx}]`]: query }),
                {}
            );
    }
}
