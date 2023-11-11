import { Injectable } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { ExpressionResult, QueryConfig, Expression, QueryConfigExpressions, QueryResult } from '../../models';
import { DataAccessor } from '../data/data.accessor';
import { RegularExpressions } from '../../constants';
import { GraphQLQueryBuilder } from '../graphql/graphql-query.builder';
import { ApiService } from '../api/api.service';
import { IndexStructureService } from '../index/index-structure.service';
import { ExpressionEvaluator } from './expression.evaluator';

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
                                data: { ...r.data, ...x.data },
                                indexStructure: { ...r.indexStructure, ...x.indexStructure },
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
        let expressionsToEvaluate = [ ...queryExpressions.expressions ];
        const expressionResults: ExpressionResult[] = [];
        
        while (expressionsToEvaluate.length) {
            const expression = expressionsToEvaluate.shift() as Expression;
            const expressionResult = ExpressionEvaluator.evaluate(expression, prevQueryResult);
            expressionResults.push(expressionResult);

            expressionsToEvaluate = [
                ...expressionsToEvaluate.filter(x => !x.expression.includes(expression.expression)),
                ...expressionsToEvaluate
                    .filter(x => x.expression.includes(expression.expression))
                    .flatMap(x =>
                        expressionResult.result.map(r =>
                            ({ ...x, expression: x.expression.replace(expressionResult.expression, r) } as Expression) ))
            ];
        }

        const readyQueryConfigs = expressionResults.reduce(
            (configs, exprRes) => {
                return configs.flatMap(c => 
                    exprRes.result.map(r =>
                       ({ ...c, query: c.query.replace(exprRes.expression, r) }) ));
            },
            [queryExpressions] as QueryConfig[]
        );

        const { alias, index } = queryExpressions;
        const readyQueries = readyQueryConfigs.map(x => x.query);

        return this.runQueries(readyQueries)
            .pipe(
                map(data => {
                    const dataPathByAlias = this.buildDataPathByAlias(alias, readyQueries);
                    let indexStructure = {};

                    if (index) {
                        const arrayData = readyQueries
                            .map(q => DataAccessor.getDataByPath(q, data))
                            .filter(d => Array.isArray(d));
                        indexStructure = IndexStructureService.buildIndexStructure(index, arrayData, queryExpressions.usedIndexes, prevQueryResult.indexStructure);
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
