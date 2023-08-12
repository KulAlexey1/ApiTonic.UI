import { RegularExpressions } from '../constants';
import { IndexGroup, IndexValue, QueryConfig, QueryConfigExpressions } from '../models';
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
//         },
//     ]
// };

export class QueryConfigService {
    static build(queryConfigs: QueryConfig[]) {   
        const queryExpressions = this.buildExpressions(
            queryConfigs.map(x => x.query));
        const readyQueries = queryExpressions
            .filter(x => x.ready)
            .map(x => x.query);
        const graphQLRequestQuery = GraphQLQueryBuilder.buildQuery(readyQueries);

        // think how to call it in static or then from where whole this method should be called?
        this.apiService.get(graphQLRequestQuery);
    }

    //1
    static buildExpressions(queries: string[]): QueryConfigExpressions[] {
        return queries
            .map(x => {
                const expressions = [ ...new Set(x.match(RegularExpressions.queryExpression))] // get text between each {{ }}
                    .map(x => x.slice(2, x.length - 2)); // remove {{ and }}
                return {
                    query: x,
                    expressions,
                    ready: expressions.length === 0
                };
            });
    }

    //3 send graphql query and receive data
    // NOTE: this step should be implemented in different class 
    // static getQueryData(graphQLQuery: string): Observable<any> {
    //     return this.apiService.get(graphQLQuery);
    // }

    //4 get index path by query
    static buildIndexGroups(readyArrayQueryConfigs: Required<QueryConfig>[], queryData: any): IndexGroup[] {
        const firstInvalidConfig = readyArrayQueryConfigs.find(x => !this.isQueryArray(x.query, queryData))
        if (firstInvalidConfig) {
            throw new Error(`Invalid query config containing index and not array query. Query: ${firstInvalidConfig.query}, Index: ${firstInvalidConfig.index}`);
        }

        return readyArrayQueryConfigs.flatMap(x =>
            (this.getDataByPath(x.query, queryData) as Array<any>)
                ?.map((_, idx) => ([ { index: x.index, value: idx } as IndexValue ] as IndexGroup) )
        );
    }

    //5 


    //coinCodex.coinList.data.shortname
    // [ 'BTC', 'ETH' ]
    private static getDataByPath(path: string, data: any): any {
        return path.split('.').reduce((obj, prop) => {
            const idxMatches = prop.match(RegularExpressions.arrayExpression);
            const isObjArray = Array.isArray(obj);

            if (idxMatches && !isObjArray) {
                throw new Error(`Invalid path found: the index is applied to the object. Path: ${path}. Data: ${data}.`);
            }

            if (!idxMatches) {
                return isObjArray ? obj.map(x => x[prop]) : (obj || {})[prop];
            }

            return idxMatches.reduce((o, idxString) => o[idxString.slice(1, idxString.length - 1)], obj[prop.replaceAll(RegularExpressions.arrayExpression, "")]);
        }, data);
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
}
