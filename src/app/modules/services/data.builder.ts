import { Injectable } from "@angular/core";
import { map, mergeMap, switchMap } from "rxjs/operators";
import { ExpressionResult, IndexGroup, IndexStructure, QueryConfig, QueryConfigExpression, QueryConfigExpressions, QueryResult } from "../models";
import { QueryConfigService } from "./query-config.service";
import { GraphQLQueryBuilder } from "./graphql-query.builder";
import { ApiService } from "./api.service";
import { Observable, forkJoin, of } from 'rxjs';
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
                                indexStructure: { ...r.indexStructure, ...x.indexStructure }
                            } as QueryResult))
                        )
                    )
                );
            },
            of({ data: {}, indexStructure: [] } as QueryResult)
        );
    }

    private evaluateExpressionsAndRunQueries(queryExpressions: QueryConfigExpressions, prevQueryResult: QueryResult): Observable<QueryResult> {
        const expressionResults = queryExpressions.expressions.reduce(
            (expressionResults, expression) =>
                ([ ...expressionResults, this.evaluateQueryExpression(expression, prevQueryResult) ]),
            new Array<ExpressionResult>()
        );

        expressionResults.map(x =>)

        //go by expression results and replace

        //queryExpressions -> queryConfig -> expressionsResults + queryConfig -> readyQueryConfigs

        const readyQueryConfigs = [];

        return this.runQueries(readyQueryConfigs);
    }

    private evaluateQueryExpression(configExpression: QueryConfigExpression, queryResult: QueryResult): ExpressionResult {
        const expression = configExpression.expression;

        switch (configExpression.type) {
            case 'queryArray':
                return this.evaluateQueryArrayExpression(queryConfigs, expression, queryResult);
            case 'queryValue':
                return this.evaluateQueryValueExpression(queryConfigs, expression, queryResult);
            case 'method':
                return this.evaluateMethodExpression(queryConfigs, expression);
            default:
                throw new Error(`Evaluation of ${configExpression.type} expression is not implemented yet`);
        }
    }

    // coinCodex.currentCoin.shortname
    private evaluateQueryValueExpression(queryConfigs: QueryConfig[], expression: string, result: QueryResult): QueryConfig[] {
        return queryConfigs.map(c =>
            ({ ...c, query: c.query.replace(expression, QueryConfigService.getDataByPath(expression, result.data) ) } as QueryConfig) );
    }

    // 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction',
    // coinCodex.coinList.data[coinIdx].shortname
    private evaluateQueryArrayExpression(queryConfigs: QueryConfig[], expression: string, result: QueryResult): QueryConfig[] {
        const usedIndexes = expression.match(RegularExpressions.arrayExpression)
            ?.map(x => x.slice(1, x.length - 1));
        const indexStructure = result.indexStructure.find(x =>
            x.indexes.length === usedIndexes?.length && x.indexes.every(y => usedIndexes.includes(y)));
        const indexGrops = indexStructure?.groups ?? [];

        const readyExpressions = indexGrops.map(group =>
            group.reduce(
                (expression, indexValue) =>
                    expression.replace(`[${indexValue.index}]`, `[${indexValue.value}]`),
                expression
            )
        );

        return queryConfigs.flatMap(c =>
            readyExpressions.map(expr =>
                ({ ...c, query: c.query.replace(expression, QueryConfigService.getDataByPath(expr, result.data) ) } as QueryConfig) ));

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
    private evaluateMethodExpression(queryConfigs: QueryConfig[], expression: string): QueryConfig[] {
        const startBracketIdx = expression.indexOf('(');
        const endBracketIdx = expression.indexOf(')');
        const methodName = expression.slice(0, startBracketIdx);
        const args = expression.slice(startBracketIdx + 1, endBracketIdx);

        const method = this.methods[methodName];
        if (!method) {
            throw new Error(`The method ${methodName} is not supported or not implemented yet`);
        }

        const methodResult = this.methods[methodName](args);

        return queryConfigs.map(c => 
            ({ ...c, query: c.query.replace(expression, methodResult) }))
    }

    private runQueries(queryConfigs: QueryConfig[]): Observable<QueryResult> {
        const graphQLQuery = GraphQLQueryBuilder.buildQuery(queryConfigs.map(x => x.query));

        return this.apiService.get(graphQLQuery).pipe(
            map(data => {
                const indexStructure: IndexStructure[] = [];

                if (isArray(this.getDataByPath(query, data))) {
                    indexStructure.push();
                }

                return { data, indexStructure };
            })
        );

        
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
    }
}