import { RegularExpressions } from '../../constants';
import { QueryConfig, QueryConfigExpressions } from '../../models';
import { ExpressionHelpers } from '../helpers';
import { ExpressionBuilder } from './expression.builder';

 // newConfig = {
 //     queries: [
 //         {
 //             query: 'coinCodex.coinList.data.shortname',
 //             alias: 'shortNames',
 //             index: 'shortNameIdx'
 //         },
 //         {
 //             query: 'coinCodex.{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
 //             alias: predictions,
 //             index: 'predictionIdx'
 //         },
 //     ]
 // };

export class QueryConfigExpressionBuilder {
    // query1 expr1 queryValue
    // query1 expr2 queryArray

    // query2 expr1 queryValue
    // query2 expr2 queryArray
    // query2 expr3 method

    // query3
    static buildOrderedQueriesExpressions(queryConfigs: QueryConfig[]): QueryConfigExpressions[] {
        const queryAliases = queryConfigs.map(x => x.alias);
        const queryIndexes = queryConfigs.filter(x => x.index).map(x => x.index as string);

        let queriesExpressions: QueryConfigExpressions[] = queryConfigs
            .map(x => {
                const orderedQueryExpressions = ExpressionBuilder.buildOrderedExpressionsFromText(x.query, queryAliases);
                const usedIndexes = queryIndexes.filter(idx =>
                    orderedQueryExpressions.some(e => e.expression.includes(`[${idx}]`)));

                return { ...x, expressions: orderedQueryExpressions, usedIndexes };
            });

        return this.orderAllExpressions(queriesExpressions);
    }

    private static orderAllExpressions(queriesExpressions: QueryConfigExpressions[]): QueryConfigExpressions[] {
        let orderedQueriesExpressions: QueryConfigExpressions[] = [];

        while (queriesExpressions.length) {
            const orderedQueryExpressions = this.getOrderedExpressionsForOne(queriesExpressions[0], queriesExpressions);
            orderedQueriesExpressions.push(...orderedQueryExpressions);
            
            const orderedQueries = orderedQueriesExpressions.map(x => x.query);
            queriesExpressions = queriesExpressions.filter(x => !orderedQueries.some(q => q === x.query));
        }

        return orderedQueriesExpressions;
    }

    private static getOrderedExpressionsForOne(queryExpressions: QueryConfigExpressions, queriesExpressions: QueryConfigExpressions[]): QueryConfigExpressions[] {
        const queriesUsingCurrentQuery = queriesExpressions.filter(x =>
            x.expressions
                .filter(y => y.type === 'value' || y.type === 'array')
                .some(y => y.type === 'array'
                    ? ExpressionHelpers.getArrayExpression(y.expression)?.arrayName === queryExpressions.alias
                    : y.expression === queryExpressions.alias ));

        const result = [
            queryExpressions,
            ...queriesUsingCurrentQuery
                .flatMap(x => this.getOrderedExpressionsForOne(x, queriesExpressions))
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
}
