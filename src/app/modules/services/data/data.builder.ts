import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { Observable } from 'rxjs';
import { CellValue, QueryConfig, QueryResult } from "../../models";
import { CellValueExpressionBuilder, CellValueExpressionEvaluator, QueryConfigExpressionBuilder, QueryConfigExpressionEvaluator } from '../../services';

@Injectable({ providedIn: 'root' })
export class DataBuilder {
    constructor(
        private queryExpressionEvaluator: QueryConfigExpressionEvaluator
    ) {}

    build(queryConfigs: QueryConfig[], cellValueTemplates: CellValue[]) {
        const queryResult$ = this.buildQueryResult(queryConfigs);
        const queryAliases = queryConfigs.map(x => x.alias);
        
        return queryResult$.pipe(
            map(r =>
                this.buildCellValues(cellValueTemplates, r, queryAliases)
            )
        );
    }

    // cellValues: [
    //     {
    //          may be + 1 will be necessary because of 0 * 0
    //          key: "A{{ multiply(shortNameIdx, predictionIdx[shortNameIdx]) }}",
    //          value: "{{ shortNames[shortNameIdx] }}]"
    //     },
    //     {
    //         key: "B{{ multiply(shortNameIdx, predictionIdx[shortNameIdx]) }}",
    //         value: "{{ map(predictions[shortNameIdx], x => x[0]) }}" ?? think how it should be
    //              date ([0] means take 0 element in each element of array=predictions[shortNameIdx])
    //              (may be it needs to specify somehow else, like, predictions[shortNameIdx].map(x => x[0]))
    //     },
    // ]
    private buildCellValues(cellValueTemplates: CellValue[], queryResult: QueryResult, aliases: string[]): CellValue[] {
        const orderedExpressions = CellValueExpressionBuilder.buildOrderedExpressions(cellValueTemplates, aliases);

        return CellValueExpressionEvaluator.evaluate(orderedExpressions, queryResult);
    }

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
    private buildQueryResult(queryConfigs: QueryConfig[]): Observable<QueryResult> {
        const orderedExpressions = QueryConfigExpressionBuilder.buildOrderedQueriesExpressions(queryConfigs);
        
        return this.queryExpressionEvaluator.evaluate(orderedExpressions);
    }
}