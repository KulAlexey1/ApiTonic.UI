import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { IndexGroup, QueryConfig } from "../models";
import { QueryConfigService } from "./query-config.service";
import { GraphQLQueryBuilder } from "./graphql-query.builder";
import { ApiService } from "./api.service";

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
    build(queryConfigs: QueryConfig[]) {
        //!!!!!!!!!!!! NEW APPROACH !!!!!!!!!!!!!
        // build expression tree
        // go by the tree and evaluate expressions -> QueryData, IndexGroups


        

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
}