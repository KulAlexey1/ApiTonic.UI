import { Injectable } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { merge } from 'lodash';
import { ExpressionResult, Expression, QueryConfigExpressions, QueryResult, IndexStructure } from '../../models';
import { DataAccessor } from '../data/data.accessor';
import { RegularExpressions } from '../../constants';
import { GraphQLQueryBuilder } from '../graphql/graphql-query.builder';
import { ApiService } from '../api/api.service';
import { IndexStructureService } from '../index-services/index-structure.service';
import { ExpressionEvaluator } from './expression.evaluator';
import { ExpressionHelpers } from '../helpers';

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
                                indexStructure: [ ...r.indexStructure, ...x.indexStructure ],
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
        const expressionResults = this.getExpressionResults(queryExpressions.expressions, prevQueryResult);
        const readyQueries = this.applyExpressionResults(queryExpressions.query, expressionResults);

        return this.runQueries(readyQueries)
            .pipe(
                map(data => {
                    const dataPathByAlias = this.buildDataPathByAlias(queryExpressions.alias, readyQueries);
                    let indexStructure: IndexStructure[] = [];

                    if (queryExpressions.index) {     
                        const arrayData: unknown[][] = readyQueries
                            .map(q => DataAccessor.getDataByPath(q, data))
                            .filter(d => Array.isArray(d));
                        indexStructure = arrayData.reduce<IndexStructure[]>(
                            (structure, arr) =>
                                ([
                                    ...structure,
                                    IndexStructureService.buildIndexStructure(queryExpressions.index as string, arr, queryExpressions.usedIndexes,
                                        prevQueryResult.indexStructure)
                                ]),
                            indexStructure
                        );
                        // indexStructure = IndexStructureService.buildIndexStructure(index, arrayData,
                        //     queryExpressions.usedIndexes, prevQueryResult.indexStructure);
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

    private getExpressionResults(expressions: Expression[], queryResult: QueryResult ): ExpressionResult[] {
        let expressionsToEvaluate = [ ...expressions ];
        const expressionResults: ExpressionResult[] = [];
        
        while (expressionsToEvaluate.length) {
            const expression = expressionsToEvaluate.shift() as Expression;
            const expressionResult = ExpressionEvaluator.evaluate(expression, queryResult);
            expressionResults.push(expressionResult);

            expressionsToEvaluate = [
                ...expressionsToEvaluate.filter(x => !x.expression.includes(expression.expression)),
                ...expressionsToEvaluate
                    .filter(x => x.expression.includes(expression.expression))
                    .flatMap(x =>
                        expressionResult.result.map(r =>
                            ({ ...x, expression: x.expression.replaceAll(expressionResult.expression, r) } as Expression) ))
            ];
        }

        return expressionResults;
    }

    private applyExpressionResults(textWithExpressions: string, expressionResults: ExpressionResult[]): string[] {
        return expressionResults
            .reduce(
                (texts, exprRes) => {
                    return texts.flatMap(t => 
                        exprRes.result.map(r =>
                            ExpressionHelpers.replaceExpressionPart(t, exprRes.expression, r)));
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
