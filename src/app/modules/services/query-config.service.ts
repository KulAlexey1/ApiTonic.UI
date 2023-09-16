import { PredefinedMethodNames, RegularExpressions } from '../constants';
import { IndexGroup, IndexValue, QueryConfig, QueryConfigExpression, QueryConfigExpressions, QueryConfigExpressions1 } from '../models';
import { GraphQLQueryBuilder } from './graphql-query.builder';

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
//         }
//     ]
// };

export class QueryConfigService {
    static getDataByPath(path: string, data: any): any {
        return path.split('.').reduce((obj, prop) => {
            const idxMatches = prop.match(RegularExpressions.arrayExpression);
            if (!idxMatches) {
                return (obj || {})[prop];
            }

            return idxMatches.reduce(
                (o, idxString) => o[idxString.slice(1, idxString.length - 1)],
                obj[prop.replaceAll(RegularExpressions.arrayExpression, "")]
            );
        }, data)
    }
    
    static buildIndexGroup(arrayQueryConfig: Required<QueryConfig>, queryData: any): IndexGroup {
        if (!this.isQueryArray(arrayQueryConfig.query, queryData)) {
            throw new Error(`Invalid query config containing index and not array query. Query: ${arrayQueryConfig.query}, Index: ${arrayQueryConfig.index}`);
        }

        return (this.getDataByPath(arrayQueryConfig.query, queryData) as Array<any>)
            ?.map((_, idx) => ({ index: arrayQueryConfig.index, value: idx } as IndexValue) );
    }

    static buildOrderedQueriesExpressions(queryConfigs: QueryConfig[]): QueryConfigExpressions[] {
        
        // query1 expr1 queryValue
        // query1 expr2 queryArray

        // query2 expr1 queryValue
        // query2 expr2 queryArray
        // query2 expr3 method

        // query3

        let queriesExpressions: QueryConfigExpressions[] = queryConfigs
            .map(x => {
                const queryExpressions = [ ...new Set(x.query.match(RegularExpressions.queryExpression)) ];
                const orderedQueryExpressions = queryExpressions
                    .flatMap(qx => this.buildOrderedQueryExpressions(x.query, qx));

                return { ...x, expressions: orderedQueryExpressions };
            });

        return this.buildOrderedQueries(queriesExpressions);

        // queriesExpressions.forEach(x => {
        //     const isQueryUsedInOthers = queriesExpressions.some(y =>
        //         y.query !== x.query &&
        //             y.orderedExpressions
        //                 .filter(z => z.type === 'queryValue' || z.type === 'queryArray')
        //                 .some(z => z.type === 'queryArray'
        //                     ? z.expression.replace(RegularExpressions.arrayExpression, '') === x.query
        //                     : z.expression === x.query ));
        //     if (isQueryUsedInOthers) {
        //         orderedQueriesExpressions = [ x, ...orderedQueriesExpressions ];
        //     }
        // });
    }

    private static buildOrderedQueries(queriesExpressions: QueryConfigExpressions[]): QueryConfigExpressions[] {
        let orderedQueriesExpressions: QueryConfigExpressions[] = [];

        while (queriesExpressions.length) {
            const orderedQueryExpressions = this.buildOrderedQueriesForOne(queriesExpressions[0], queriesExpressions);
            orderedQueriesExpressions.push(...orderedQueryExpressions);
            
            const orderedQueries = orderedQueriesExpressions.map(x => x.query);
            queriesExpressions = queriesExpressions.filter(x => !orderedQueries.some(q => q === x.query));
        }

        return orderedQueriesExpressions;
    }

    private static buildOrderedQueriesForOne(queryExpressions: QueryConfigExpressions, queriesExpressions: QueryConfigExpressions[]): QueryConfigExpressions[] {
        const queriesUsingCurrentQuery = queriesExpressions.filter(x =>
            x.expressions
                .filter(y => y.type === 'queryValue' || y.type === 'queryArray')
                .some(y => y.type === 'queryArray'
                    ? y.expression.replace(RegularExpressions.arrayExpression, '') === queryExpressions.query
                    : y.expression === queryExpressions.query ));

        const result = [
            ...queriesUsingCurrentQuery
                .flatMap(x => this.buildOrderedQueriesForOne(x, queriesExpressions)),
            queryExpressions
        ];

        const resultQueries = result.map(x => x.query);
        const circularQueries = resultQueries
            .filter((x, idx) => 
                resultQueries.filter((y, i) => i !== idx).some(y => y === x));
        if (circularQueries.length) {
            throw new Error(`Circular queries: ${ circularQueries.join(',') }.`);
        }

        return result;
    }

    //what should be returned for - buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    //coinCodex.coinList.data[coinIdx].shortname
    //buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)
    //123
    //buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    private static buildOrderedQueryExpressions(query: string, queryExpression: string): QueryConfigExpression[] {
        const orderedQueryExpressions: QueryConfigExpression[] = [];
    
        const methodExpressions = queryExpression.match(RegularExpressions.methodExpression);
        if (methodExpressions?.length && methodExpressions?.length > 1) {
            throw new Error(`Invalid query expression containing multiple methods: ${queryExpression}. Query: ${query}.`);
        }
        
        if (methodExpressions?.length) {
            const methodExpression = methodExpressions[0];
            const methodParams = methodExpression.split(',').map(x => x.trim());

            orderedQueryExpressions.push(
                ...methodParams.flatMap(mp => this.buildOrderedQueryExpressions(query, mp)),
                { expression: methodExpression, type: 'method' } as QueryConfigExpression
            );
        } else {
            const arrayExpressions = queryExpression.match(RegularExpressions.arrayExpression);
            if (arrayExpressions?.length && arrayExpressions?.length > 1) {
                throw new Error(`Invalid query expression containing multiple arrays: ${queryExpression}. Query: ${query}.`);
            }
            
            if (arrayExpressions?.length) {
                orderedQueryExpressions.push({ expression: arrayExpressions[0], type: 'queryArray' } as QueryConfigExpression);
            } else {
                orderedQueryExpressions.push({ expression: queryExpression, type: 'queryValue' } as QueryConfigExpression);
            }
        }

        return [ ...new Set(orderedQueryExpressions) ];
    }

    private static isQueryArray(query: string, data: any): boolean {
        let propValue = data;

        for (const prop of query.split('.')) {
            propValue = propValue[prop];

            if (Array.isArray(propValue)) {
                return true;
            }
        }

        return false;
    }


    // private static buildExpressions(query: string, oneOperatorExpression: string): QueryConfigExpression[] {
    //     return oneOperatorExpression.split(',')
    //         .map(x => ({
    //             query,
    //             expression: x.trim(),
    //             type: RegularExpressions.methodExpression.test(x)
    //                 ? 'method'
    //                 : RegularExpressions.arrayExpression.test(x)
    //                     ? 'queryArray'
    //                     : 'queryValue'
    //         } as QueryConfigExpression));
    // }

    //1
    // static buildExpressions1(queries: string[]): QueryConfigExpressions1[] {
    //     return queries
    //         .map(x => {
    //             const expressions = [ ...new Set(x.match(RegularExpressions.queryExpression))] // get text between each {{ }}
    //                 .map(x => x.slice(2, x.length - 2)); // remove {{ and }}
    //             return {
    //                 query: x,
    //                 expressions,
    //                 ready: expressions.length === 0
    //             };
    //         });
    // }

    //3 send graphql query and receive data
    // NOTE: this step should be implemented in different class 
    // static getQueryData(graphQLQuery: string): Observable<any> {
    //     return this.apiService.get(graphQLQuery);
    // }

    //4 get index path by query
    // static buildIndexGroups(readyArrayQueryConfigs: Required<QueryConfig>[], queryData: any): IndexGroup[] {
    //     const firstInvalidConfig = readyArrayQueryConfigs.find(x => !this.isQueryArray(x.query, queryData))
    //     if (firstInvalidConfig) {
    //         throw new Error(`Invalid query config containing index and not array query. Query: ${firstInvalidConfig.query}, Index: ${firstInvalidConfig.index}`);
    //     }

    //     return readyArrayQueryConfigs.flatMap(x =>
    //         (this.getDataByPath(x.query, queryData) as Array<any>)
    //             ?.map((_, idx) => ([ { index: x.index, value: idx } as IndexValue ] as IndexGroup) )
    //     );
    // }

    // static isQueryArray(query: string, data: any): boolean {
    //     let propValue = data;

    //     for (const prop of query.split('.')) {
    //         propValue = propValue[prop];

    //         if (Array.isArray(propValue)) {
    //             return true;
    //         }
    //     }

    //     return false;
    // }

    //5 
    //{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}
    //{{coinCodex.coinList.data[coinIdx].shortname}},
    // static replaceQueryExpressions(queryExpressions: QueryConfigExpressions1, readyQueries: string[], data: any): QueryConfigExpressions1[] {
    //     //validate query configs expressions contain only allowed types (array, predefined methods, etc.)
    //     // const queryArrays = queryExpressions.expressions;
    //     // const queryValues = queryExpressions.expressions;
    //     // const queryMethods = queryExpressions.expressions; 

    //     queryExpressions.expressions.forEach(expression => {
    //         const orderedExpressions = this.buildOrderedSimpleExpressions(expression);
    //         orderedExpressions.forEach(x => this.evaluateSimpleExpression(x, data));
    //     });
    // }

    //{{coinCodex.coinList.data[coinIdx].shortname}}
    //{{buildGraphQLAlias("ETH")}}
    // private static evaluateSimpleExpression(expression: string, data: any): string[] {
        
    // }

    // private static validateQueryArrays(query: string, queryArrayExpression: string, queries: string[]): void {
    //     // const queryArray = queryArrayExpression.replace(RegularExpressions.arrayExpression, '');
    //     // if (!queries.some(x => x === queryArray)) {
    //     //     throw new Error(`Invalid query array expression ${queryArrayExpression} in query ${query}`);
    //     // }
    // }

    // private static validateQueryValues(): void {

    // }

    // private static validateQueryMethods(): void {

    // }



    //coinCodex.coinList.data.shortname
    // [ 'BTC', 'ETH' ]
    // private static getDataByPath(path: string, data: any): any {
    //     return path.split('.').reduce((obj, prop) => {
    //         const idxMatches = prop.match(RegularExpressions.arrayExpression);
    //         const isObjArray = Array.isArray(obj);

    //         if (idxMatches && !isObjArray) {
    //             throw new Error(`Invalid path found: the index is applied to the object. Path: ${path}. Data: ${data}.`);
    //         }

    //         if (!idxMatches) {
    //             return isObjArray ? obj.map(x => x[prop]) : (obj || {})[prop];
    //         }

    //         return idxMatches.reduce((o, idxString) => o[idxString.slice(1, idxString.length - 1)], obj[prop.replaceAll(RegularExpressions.arrayExpression, "")]);
    //     }, data);
    // }
}
