import { Component } from '@angular/core';
import { ApiService, DataAccessor, DataBuilder, DataExpressionHelpers } from '@app/services';
import { CellValue, QueryConfig } from 'app/modules/models';
import { switchMap } from 'rxjs';

@Component({
    selector: 'app-coin-codex-coin-list',
    templateUrl: './coin-codex-coin-list.component.html',
    styleUrls: ['./coin-codex-coin-list.component.scss']
})
export class CoinCodexCoinListComponent {
    queryConfigs: QueryConfig[] = [
        {
            query: 'coinCodex.coinList.data.shortname',
            index: 'shortNameIdx',
            alias: 'shortNames'
        },
        {
            query: 'coinCodex.{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
            index: 'predictionIdx',
            alias: 'predictions'
        }
    ];

    cellValueTemplates: CellValue[] = [
        {
            key: 'A{{multiply(sum(shortNameIdx, 1), sum(predictionIdx[shortNameIdx], 1))}}',
            value: '{{shortNames[intDiv(multiply(sum(shortNameIdx, 1), sum(predictionIdx[shortNameIdx], 1)), predictionIdx[shortNameIdx].length)]}}'
        },
        // {
        //     key: 'B{{multiply(shortNameIdx, predictionIdx[shortNameIdx])}}',
        //     value: '{{predictions[shortNameIdx][0]}}'
        // }
    ];

    constructor(private dataBuilder: DataBuilder, private apiService: ApiService) { }

    onClick(): void {
        // debug case with predictionIdx[shortNameIdx] expression and predictions[shortNameIdx][0]


        // const result = ExpressionHelpers.getArrayExpression('abc data[0][1][2][var1] text');



        // DataAccessor.getDataByPath("coinCodex.coinList.data[0][1].shortname", {
        //     "coinCodex": {
        //         "__typename": "CoinCodexQuery",
        //         "coinList": {
        //             "__typename": "CcCoinListResult",
        //             "data": [
        //                 {
        //                     "__typename": "CcCoin",
        //                     "shortname": "bitcoin"
        //                 },
        //                 {
        //                     "__typename": "CcCoin",
        //                     "shortname": "ethereum"
        //                 },
        //                 {
        //                     "__typename": "CcCoin",
        //                     "shortname": "tether"
        //                 }
        //             ]
        //         }
        //     }
        // });

        this.dataBuilder.build(this.queryConfigs, this.cellValueTemplates)
            .pipe(
                switchMap((cellValues) =>
                    this.apiService.getExcelFileBase64(cellValues))
            )
            .subscribe((excelFileBase64) => console.log(excelFileBase64));
    }
}


// @Component({
//     selector: 'app-coin-codex-coin-list',
//     templateUrl: './coin-codex-coin-list.component.html',
//     styleUrls: ['./coin-codex-coin-list.component.scss']
// })
// export class CoinCodexCoinListComponent implements OnInit {
//     coins: { name: string }[] = [];
//     // {columnIdx} {rowIdx}
//     // {coinIdx} {predictionIdx}
//     // selectedProps = [
//     //     { key: "A{{ {{coinIdx}}*{{predictionIdx}} }}", value: "coinCodex.coins[{{coinIdx}}].shortname" }, //shortname
//     //     { key: "B{{ {{coinIdx}}*{{predictionIdx}} }}", value: "coinCodex.prediction(shortName: {coinCodex.coins[{{coinIdx}}].shortname}).thirtyDayPrediction[{{ {{coinIdx}}*{{predictionIdx}} }}][0]" }, //date
//     //     { key: "C{ {{coinIdx}}*{{predictionIdx}} }}", value: "coinCodex.prediction(shortName: {coinCodex.coins[{{coinIdx}}].shortname}).thirtyDayPrediction[{{ {{coinIdx}}*{{predictionIdx}} }}][1]" }, //price
//     //     { key: "D{ {{coinIdx}}*{{predictionIdx}} }}", value: "coinCodex.prediction(shortName: {coinCodex.coins[{{coinIdx}}].shortname}).thirtyDayPrediction[{{ {{coinIdx}}*{{predictionIdx}} }}][2]" }, //price percent change
//     // ];

//     constructor(private coinCodexService: CoinCodexService, private apiService: ApiService) {}

//     ngOnInit(): void {
//         this.coinCodexService.getCoins().subscribe((x) => {
//             this.coins = (<any>x).coinCodex.coins;
//         });
//     }

//     // prediction = "coinCodex.prediction(shortname: {{shortname}}]).thirtyDayPrediction"; // date
//     // coin = "coinCodex.coins[].shortname";
//     // config = {
//     //     queries: [
//     //         { variable: "coinsShortnames", query: "coinCodex.coins.shortname" },
//     //         { query: "coinCodex.prediction(shortname: {{coinsShortnames}}).thirtyDayPrediction" }
//     //     ]
//     // };

//     newConfig = {
//         queries: [
//             {
//                 query: 'coinCodex.coinList.data.shortname',
//                 index: 'coinIdx'
//             },
//             {
//                 query: 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction',
//                 index: 'predictionIdx'
//             },
//         ]
//     };

//     config: DataConfig = {
//         indexes: [
//             { index: 'coinIdx', query: 'coinCodex.coinList.data' },
//             { index: 'predictionIdx', query: 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction' }
//             // { index: 'predictionIdx', path: 'coinCodex.{{coinCodex.coins[coinIdx].shortname}}' }
//         ],
//         queries: [
//             'coinCodex.coinList.data.shortname',
//             'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction'
//             // 'coinCodex.{{coinCodex.coins[coinIdx].shortname}}: prediction(shor tname: "{{coinCodex.coins[coinIdx].shortname}}").thirtyDayPrediction'
            
//             // { index: "coinIdx", query: "coinCodex.coins.shortname" },
//             // { index: "predictionIdx", query: 'coinCodex.{{coinCodex.coins[coinIdx].shortname}}: prediction(shortname: "{{coinCodex.coins[coinIdx].shortname}}").thirtyDayPrediction' }
//         ],
//         cellValues: [
//             { key: "A{{ {{coinIdx}}*{{predictionIdx}} }}", value: "coinCodex.coinList.data[{{coinIdx}}].shortname" }, //shortname
//             {
//                 key: "B{{ {{coinIdx}}*{{predictionIdx}} }}",
//                 value: 'coinCodex.{{coinCodex.coinList.data[{{coinIdx}}].shortname}}.thirtyDayPrediction[{{ {{coinIdx}}*{{predictionIdx}} }}][0]' //date
//                 //value: 'coinCodex.prediction(shortname: "{{coinCodex.coins[{{coinIdx}}].shortname}}").thirtyDayPrediction[{{ {{coinIdx}}*{{predictionIdx}} }}][0]' //date
//             },
//         ]
//     };

//     // problem 1: can't send query like coinCodex.coinList.data, it will ask for nested property 
//     // 1) build index groups by index configs (fully with query requests)
//     // 2) build data by query configs using Index groups (result from Step 1)
//     // 3) build cell values by their configs using Index groups and Data 

//     //another approach
//     // get query data (without deps)
//     // build index groups
//     // get query data with indexes
//     // build index groups
//     // build cells by Index Groups and Query data

//     fullData: Observable<any> = of(null);
//     onClick() {
//         // this.getData(['coinCodex.prediction(shortname: "bitcoin").thirtyDayPrediction[{{ {{coinIdx}}*{{predictionIdx}} }}][0]'])
//         //     .subscribe(x => console.log(x))
//         this.fullData = this.buildFullData(this.config);
//         this.fullData.subscribe(x => console.log(x));

//         // this.apiService.get(
//         //     '{ coinCodex { prediction(shortname: "bitcoin") { thirtyDayPrediction } } }')
//         // .subscribe(x => console.log(x));
//     }

//     buildIndexesData(indexConfigs: IndexConfig[], data: any) {
//         //coinIdx_predictionIdx
//         const resultIndexGroups: { [indexNames: string]: IndexGroup[] } = {};
//         const readyIndexNames: string[] = [];

//         while (readyIndexNames.length !== indexConfigs.length) {
//             const configsWithAllParentReadyIndexes = this.filterByContainingOnlyOrEmpty(indexConfigs, readyIndexNames);
//             configsWithAllParentReadyIndexes.forEach(configWithAllParentReadyIndexes => {
//                 const parentIndexNames = this.getParentIndexNames(configWithAllParentReadyIndexes);
//                 const indexGroups = this.buildIndexGroups(configWithAllParentReadyIndexes, resultIndexGroups, parentIndexNames, data);

//                 Object.assign(resultIndexGroups, { [indexGroups.indexNames]: indexGroups.groups });
//                 readyIndexNames.push(configWithAllParentReadyIndexes.index);
//             });
//         }

//         return resultIndexGroups;
//     }

//     filterByContainingOnlyOrEmpty(indexConfigs: IndexConfig[], indexNames: string[], data: any): IndexConfig[] {

//     }

//     getParentIndexNames(indexConfig: IndexConfig): string[] {

//     }

//     //parentIndexNames - can be empty
//     buildIndexGroups(indexConfig: IndexConfig, indexGroups: { [indexNames: string]: IndexGroup[] }, parentIndexNames: string[]): { indexNames: string, groups: IndexGroup[] } {

//     }

//     ////////////////////////

//     buildFullData(config: DataConfig): Observable<any> {
//         return this.buildData(config.queries, config.indexes, {})
//             .pipe(
//                 expand(x => x.nonReadyQueries.length === 0 ? EMPTY : this.buildData(x.nonReadyQueries, config.indexes, x.data)),
//                 map(x => x.data)
//             );
//     }

//     buildData(
//         queriesToBuildData: string[],
//         indexes: {
//             index: string,
//             path: string
//         }[],
//         initialData: any
//     ): Observable<{ nonReadyQueries: string[], data: any }> {
//         // console.log(simpleQueries);
//         return new Observable<{ readyQueries: QueryConfig[]; nonReadyQueries: QueryConfig[] }>((subscriber) => {
//             let queryConfigs = this.buildQueries(queriesToBuildData);

//             const readyQueries = queryConfigs.filter(x => x.ready);
//             if (readyQueries.length === 0) {
//                 throw new Error('Invalid query config');
//             }

//             const nonReadyQueries = queryConfigs.filter(x => !x.ready);

//             subscriber.next({ readyQueries, nonReadyQueries });
//             subscriber.complete();
//         }).pipe(
//             mergeMap(queries => {
//                 const readyQueries = queries.readyQueries.map(x => x.query);

//                 return this.getData(readyQueries).pipe(
//                     map(data => {
//                         const fullData = { ...initialData, ...data };

//                         const nonReadyQueries = queries.nonReadyQueries.flatMap(q =>
//                             this.replaceExpressionsWithValues(q.query, q.expressions, readyQueries, fullData, indexes));

//                         return { nonReadyQueries, data: fullData };
//                     })
//                 );
//             })
//         )
//     }

//     regExpForExpressions = /\{\{.*?\}\}/g;

//     //'coinCodex.{{buildGraphQLAlias(coinCodex.coins[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coins[coinIdx].shortname}}").thirtyDayPrediction'
//     buildQueries(values: string[]): QueryConfig[] {
//         const result = values
//             .map(x => ({ query: x, expressions: [ ...new Set(x.match(this.regExpForExpressions)) ].map(x => x.slice(2, x.length - 2)) }))
//             .map(x => ({ ...x, ready: x.expressions.length === 0 }));

//         return result;
//     }

//     getData(queries: string[]): Observable<any> {
//         const graphQLQuery = this.buildGraphQLQuery(queries);
//         return this.apiService.get(graphQLQuery);
//     }

//     regExpForMethodParams = /\(.*?\)/g;
//     regExpForMethods = /.+\(.*?\)/g;
//     regExpForArray = /\[.*?\]/g;
//     notAllowedAliasCharsRegExp = /[^_A-Za-z][^_0-9A-Za-z]*/g;

//     methods: { [name: string]: (args: any) => any } = {
//         'buildGraphQLAlias': this.buildGraphQLAlias.bind(this)
//     };

//     //'coinCodex.{{buildGraphQLAlias(coinCodex.coins[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coins[coinIdx].shortname}}").thirtyDayPrediction'
//     //buildGraphQLAlias(coinCodex.coins[coinIdx].shortname) + coinCodex.coins[coinIdx].shortname
//     //coinCodex.coins.shortname
//     replaceExpressionsWithValues(query: string, expressions: string[], readyQueries: string[],
//             data: any, indexes: { index: string; path: string }[]): string[] {
//     //get indexes from query
//     //loop by index and inside loop by expressions

//         const readyExpressions = expressions.filter(expr =>
//             readyQueries.includes(expr.replaceAll(this.regExpForArray, ""))
//                 || expr.match(this.regExpForMethodParams)
//                     ?.map(y => y.slice(1, y.length - 1).split(','))
//                     .every(methodParams => methodParams.every(z => readyQueries.includes(z.replaceAll(this.regExpForArray, ""))))
//         );

//         const queryIndexStrings = [ ...new Set(readyExpressions.flatMap(x => x.match(this.regExpForArray)?.map(x => x.slice(1, x.length - 1)))) ];
//         const queryIndexes = indexes.filter(x => queryIndexStrings?.includes(x.index));

//         const indexesLength: { [index: string]: { length: number; } } = queryIndexes
//             .reduce((obj, queryIndex) => ({ ...obj, [queryIndex.index]: { length: this.getDataByPath(queryIndex.path, data).length } }), {});
//         const maxIndexLength = Math.max(...Object.keys(indexesLength).map(x => indexesLength[x].length));

//         const allIndexedReadyExpressions: string[][] = [];

//         for (let idx = 0; idx < maxIndexLength; idx++) {
//             let indexedReadyExpressions: string[] = [...readyExpressions];

//             Object.keys(indexesLength)
//                 .filter(x => idx < indexesLength[x].length)
//                 .forEach(indexName => indexedReadyExpressions = indexedReadyExpressions.map(x => x.replaceAll(`[${indexName}]`, `[${idx}]`)));

//             allIndexedReadyExpressions.push(indexedReadyExpressions);
//         }

//         return allIndexedReadyExpressions.map(indexedReadyExpressions => {
//             let processedQuery = query;

//             indexedReadyExpressions.forEach((expr, idx) => {
//                 const methodsParams = expr.match(this.regExpForMethodParams);
//                 const expressionData = methodsParams ? this.buildMethodExpressionData(expr, methodsParams, data) : this.buildExpressionData(expr, data);
                
//                 processedQuery = processedQuery.replaceAll(`{{${readyExpressions[idx]}}}`, expressionData);
//             });

//             return processedQuery;
//         });

//         // readyExpressions.forEach(expr => {
//         //     //buildGraphQLAlias(coinCodex.coins[coinIdx].shortname)
//         //     const methodsParams = expr.match(this.regExpForMethodParams);
//         //     if (methodsParams) {
//         //         const methodsExpressionsData = this.buildMethodExpressionData(expr, methodsParams, data);
//         //         resultQueries = methodsExpressionsData.flatMap(x => resultQueries.map(q => q.replaceAll(`{{${expr}}}`, x)));
//         //     } else {
//         //         const expressionData = this.buildExpressionData(expr, data);
//         //         //here memory crash
//         //         resultQueries = expressionData.flatMap(x => resultQueries.map(q => q.replaceAll(`{{${expr}}}`, x)));
//         //     }
//         // });

//         // return resultQueries;
//     }

//     buildMethodExpressionData(methodExpression: string, methodsParams: string[], data: any): string {
//         methodsParams.forEach(methodParamsString => {
//             const methodParams = methodParamsString
//                 .slice(1, methodParamsString.length - 1) // to remove ()
//                 .split(',')
//                 .map(x => x.trim());
//             //coinCodex.coins[coinIdx].shortname
//             methodParams.forEach(p => {
//                 const methodExpressionData = this.buildExpressionData(p, data);
//                 methodExpression = methodExpression.replaceAll(p, methodExpressionData);
//             });
//         });

//         const startBracketIdx = methodExpression.indexOf('(');
//         const endBracketIdx = methodExpression.indexOf(')');
//         const methodName = methodExpression.slice(0, startBracketIdx);
//         const args = methodExpression.slice(startBracketIdx + 1, endBracketIdx);

//         return this.methods[methodName](args);
//     }

//     buildExpressionData(expression: string, data: any): string {
//         return this.getDataByPath(expression, data);
//     }

//     //expected params
//     //coinCodex.coins[coinIdx].shortname
//     replaceExpressionIndexes(expression: string, data: any, indexes: { index: string; path: string }[]): string[] {
//         const simpleQueries: string[] = [];

//         indexes.forEach(x => {
//             const idxMatches = expression.includes(`[${x.index}]`);
//             if (idxMatches) {
//                 //get array for index
//                 const arr = this.getDataByPath(x.path, data) as Array<any>;
//                 simpleQueries.push(
//                     ...arr.map((_, idx) => expression.replaceAll(`[${x.index}]`, `[${idx.toString()}]`))
//                 );
//             }
//         });

//         return simpleQueries;
//     }

//     //{ index: 'coinIdx', path: 'coinCodex.coins' },
//     //{ index: 'predictionIdx', path: 'coinCodex.{{coinCodex.coins[coinIdx].shortname}}' }
//     getDataByPath(path: string, data: any): any {
//         return path.split('.').reduce((obj, prop) => {
//             const idxMatches = prop.match(this.regExpForArray);
//             if (!idxMatches) {
//                 return (obj || {})[prop];
//             }

//             return idxMatches.reduce((o, idxString) => o[idxString.slice(1, idxString.length - 1)], obj[prop.replaceAll(this.regExpForArray, "")]);
//         }, data)
//     }

// //coinCodex.bitcoin: prediction(shortname: "bitcoin").thirtyDayPrediction
//     buildGraphQLQuery(queries: string[]) {
//         const newQueries = queries.map(q => q.replaceAll(this.regExpForArray, ""));

//         const obj = this.buildObj(newQueries);
//         return this.buildString(obj);
//     }
    
//     buildGraphQLAlias(alias: string) {
//         return alias.replace(this.notAllowedAliasCharsRegExp, () => '_');
//     }

//     buildObj(queries: string[]): any {
//         const obj: any = {};

//         queries.forEach(query => {
//             const queryProps = query.split('.');
//             let nestedObj = obj;

//             queryProps.forEach(prop => {
//                 if (!nestedObj[prop]) {
//                     nestedObj[prop] = {};
//                 }   
//                 nestedObj = nestedObj[prop];
//             });
//         });
        
//         return obj;
//     }

//     buildString(obj: any): string {
//         let query = '';
        
//         for (const property in obj) {
//             query += Object.keys(obj[property]).length === 0 ? `${property},` : `${property} ${this.buildString(obj[property])},`;
//         }

//         //to remove "," at the end
//         return `{ ${query.slice(0, -1)} }`;
//     }

//     buildExportDictionary() {}
// }

// export interface DataConfig {
//     indexes: IndexConfig[];
//     queries: string[];
//     cellValues: {
//         key: string;
//         value: string;
//     }[]
// }

// export interface IndexConfig {
//     index: string,
//     query: string
// }


// export interface QueryConfig {
//     query: string;
//     ready: boolean;
//     expressions: string[];
// }

// export interface IndexValue {
//     index: string;
//     value: number;
// }

// export type IndexGroup = IndexValue[];