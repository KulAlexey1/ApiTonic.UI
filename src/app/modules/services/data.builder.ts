import { Injectable } from "@angular/core";
import { map, switchMap } from "rxjs/operators";
import { ExpressionResult, IndexGroup, IndexStructure, IndexValue, QueryConfig, QueryConfigExpression, QueryConfigExpressions, QueryResult } from "../models";
import { QueryConfigService } from "./query-config.service";
import { GraphQLQueryBuilder } from "./graphql-query.builder";
import { ApiService } from "./api.service";
import { Observable, of } from 'rxjs';
import { PredefinedMethodNames, RegularExpressions } from '../constants';

@Injectable({ providedIn: 'root' })
export class DataBuilder {
    constructor(private apiService: ApiService) {}

    // newConfig = {
    //     queries: [
    //         {
    //             query: 'coinCodex.coinList.data.shortname',
    //             index: 'coinIdx'
    //         },
    //         {
    //             query: 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction',
    //             query: 'coinCodex.BTC: prediction(shortname: "BTC").thirtyDayPrediction',
    //             index: 'predictionIdx'
    //         },
    //     ]
    // };

    // newConfig = {
    //     queries: [
    //         {
    //             query: 'coinCodex.coinList.data.shortname',
    //             alias: 'shortNames'
    //             index: 'shortNameIdx'
    //         },
    //         {
    //             query: 'coinCodex.{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
    //             alias: predictions
    //             index: 'predictionIdx'
    //         },
    //     ]
    // };
    build(queryConfigs: QueryConfig[]) {
        //!!!!!!!!!!!! NEW APPROACH !!!!!!!!!!!!!
        // build expression tree
        // go by the tree and evaluate expressions -> QueryData, IndexGroups

        const orderedExpressions = QueryConfigService.buildOrderedQueriesExpressions(queryConfigs);
        
        const result$ = this.evaluateQueriesExpressions(orderedExpressions);

        // create cell values by config + result

        // const allIndexGroups: IndexGroup[] = [];
        // const allQueryData = {};

        // const queryExpressions = QueryConfigService.buildExpressions(queryConfigs.map(x => x.query));
        // const readyQueries = queryExpressions.filter(x => x.ready).map(x => x.query);
        // const graphQLRequestQuery = GraphQLQueryBuilder.buildQuery(readyQueries);

        // const result = this.apiService.get(graphQLRequestQuery).pipe(
        //     map(queryData => {
        //         const readyArrayQueries = queryConfigs
        //             .filter(c => readyQueries.includes(c.query) && QueryConfigService.isQueryArray(c.query, allQueryData)) as Required<QueryConfig>[];

        //         const indexGroups = QueryConfigService.buildIndexGroups(readyArrayQueries, allQueryData);

        //         return { queryData, indexGroups };
        //     })
        // );

        // // handle not ready queries
        // result.pipe(
        //     map(x => {
        //         const nonReadyQueryExpressions = queryExpressions.filter(x => !x.ready);
        //     })
        // );


        //types of expression
        //replace value with index

        //replace value
        //replace predefined methods with call results

        // const queryData = this.apiService.get(graphQLRequestQuery);
        // Object.assign(allQueryData, queryData);

        // const readyArrayQueries = queryConfigs
        //     .filter(c => readyQueries.includes(c.query) && QueryConfigService.isQueryArray(c.query, allQueryData)) as Required<QueryConfig>[];

        // const indexGroups = QueryConfigService.buildIndexGroups(readyArrayQueries, allQueryData);
        // allIndexGroups.push(...indexGroups);
    }

    private evaluateQueriesExpressions(expressions: QueryConfigExpressions[]): Observable<QueryResult> {
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
            const expression = expressionsToEvaluate.shift() as QueryConfigExpression;
            const expressionResult = this.evaluateQueryExpression(expression, prevQueryResult);
            expressionResults.push(expressionResult);

            expressionsToEvaluate = [
                ...expressionsToEvaluate.filter(x => !x.expression.includes(expression.expression)),
                ...expressionsToEvaluate
                    .filter(x => x.expression.includes(expression.expression))
                    .flatMap(x =>
                        expressionResult.result.map(r =>
                            ({ ...x, expression: x.expression.replace(expressionResult.expression, r) } as QueryConfigExpression) ))
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
                            .map(q => QueryConfigService.getDataByPath(q, data))
                            .filter(d => Array.isArray(d));
                        indexStructure = this.buildIndexStructure(index, arrayData, queryExpressions.usedIndexes, prevQueryResult.indexStructure);
                    }

                    return { data, indexStructure, dataPathByAlias } as QueryResult;
                })
            );
    }

    private evaluateQueryExpression(configExpression: QueryConfigExpression, queryResult: QueryResult): ExpressionResult {
        const expression = configExpression.expression;

        switch (configExpression.type) {
            case 'queryArray':
                return this.evaluateQueryArrayExpression(expression, queryResult);
            case 'queryValue':
                return this.evaluateQueryValueExpression(expression, queryResult);
            case 'method':
                return this.evaluateMethodExpression(expression);
            default:
                throw new Error(`Evaluation of ${configExpression.type} expression is not implemented yet`);
        }
    }

    // shortname
    private evaluateQueryValueExpression(expression: string, result: QueryResult): ExpressionResult {
        return {
            expression,
            result: [ QueryConfigService.getDataByPath(result.dataPathByAlias[expression], result.data) ]
        };

        // return queryConfigs.map(c =>
        //     ({ ...c, query: c.query.replace(expression, QueryConfigService.getDataByPath(expression, result.data) ) } as QueryConfig) );
    }

    // shortNames[shortNameIdx]
    private evaluateQueryArrayExpression(expression: string, result: QueryResult): ExpressionResult {
        const usedIndexes = expression.match(RegularExpressions.arrayExpression)
            ?.map(x => x.slice(1, x.length - 1));
        const indexStructure = result.indexStructure.find(x =>
            x.indexes.length === usedIndexes?.length && x.indexes.every(y => usedIndexes.includes(y)));
        const indexGrops = indexStructure?.groups ?? [];

        const resultExpressions = indexGrops.map(group =>
            group.reduce(
                (expression, indexValue) =>
                    expression.replace(`[${indexValue.index}]`, `[${indexValue.value}]`),
                expression
            )
        );

        return {
            expression,
            result: resultExpressions.map(expr =>
                QueryConfigService.getDataByPath(result.dataPathByAlias[expr], result.data))
        };

        // const readyExpressions = indexGrops.map(group =>
        //     group.reduce(
        //         (expression, indexValue) =>
        //             expression.replace(`[${indexValue.index}]`, `[${indexValue.value}]`),
        //         expression
        //     )
        // );

        // return queryConfigs.flatMap(c =>
        //     readyExpressions.map(expr =>
        //         ({ ...c, query: c.query.replace(expression, QueryConfigService.getDataByPath(expr, result.data) ) } as QueryConfig) ));


        // expr -> expression[]
        // queryconfig[] + expression[] -> queryconfig[]

        // get data by expression
        // replace expression with data in queryConfigs.query
    }
    
    private readonly methods: { [name: string]: (args: any) => string } = {
        [PredefinedMethodNames.buildGraphQLAlias]: this.buildGraphQLAlias
    };

    private buildGraphQLAlias(alias: string) {
        return alias.replace( RegularExpressions.notAllowedAliasCharsExpression, () => '_');
    }

    // 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction',
    // buildGraphQLAlias("BTC")
    private evaluateMethodExpression(expression: string): ExpressionResult {
        const startBracketIdx = expression.indexOf('(');
        const endBracketIdx = expression.indexOf(')');
        const methodName = expression.slice(0, startBracketIdx);
        const args = expression.slice(startBracketIdx + 1, endBracketIdx);

        const method = this.methods[methodName];
        if (!method) {
            throw new Error(`The method ${methodName} is not supported or not implemented yet`);
        }

        const methodResult = this.methods[methodName](args);

        return {
            expression,
            result: [ methodResult ]
        };

        // return queryConfigs.map(c => 
        //     ({ ...c, query: c.query.replace(expression, methodResult) }))
    }

    // query: 'coinCodex.{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
    // alias: predictions
    // index: 'predictionIdx'
    private runQueries(sameConfigReadyQueries: string[]): Observable<unknown> {
        const queryWithExpression = sameConfigReadyQueries.find(q =>
            RegularExpressions.queryExpression.test(q));
        if (queryWithExpression) {
            throw new Error(`It's impossible to run query with expressions. Evaluate query expressions first. Query: ${queryWithExpression.query}`);
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

    // index structure, indexes: [ 'coinIdx' ]
    // index group
    // { coinIdx: 1 }
    // index group
    // { coinIdx: 2 }

    // index structure, indexes: [ 'coinIdx', 'predictionIdx' ]
    // index group
    // { coinIdx: 1 }, { predictionIdx: 1 }
    // index group
    // { coinIdx: 1 }, { predictionIdx: 2 }
    private buildIndexStructure(index: string, arrayData: unknown[], usedIndexes: string[], prevIndexStructure: IndexStructure[]): IndexStructure {
        let groups: IndexGroup[] = [];
        
        if (usedIndexes.length) {
            const usedIndexStructure = prevIndexStructure.find(x =>
                x.indexes.length === usedIndexes.length && x.indexes.every(idx => usedIndexes.includes(idx)));
            if (!usedIndexStructure) {
                throw new Error(`No appropriate index structure was found for indexes: ${usedIndexes.toString()}`);
            }

            groups = usedIndexStructure.groups.flatMap(g =>
                arrayData.map((d, idx) =>
                    ([...g, { index, value: idx } as IndexValue ]) as IndexGroup ));
        } else {
            groups = arrayData.map((d, idx) =>
                ([ { index, value: idx } as IndexValue ] as IndexGroup ));
        }

        return { indexes: [ index, ...usedIndexes ], groups };
    }
}