import { CellValue, CellValueExpressions } from '../../models';
import { ExpressionBuilder } from './expression.builder';

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
export class CellValueExpressionBuilder {
    // query1 expr1 queryValue
    // query1 expr2 queryArray

    // query2 expr1 queryValue
    // query2 expr2 queryArray
    // query2 expr3 method

    // query3
    static buildOrderedExpressions(cellValueTemplates: CellValue[], aliases: string[]): CellValueExpressions[] {
        return cellValueTemplates
            .map(x => {
                // const orderedKeyExpressions = ExpressionBuilder.buildOrderedExpressionsFromText(x.key, aliases);
                // const usedKeyIndexes = indexes.filter(idx =>
                //     orderedKeyExpressions.some(e => e.expression.includes(`[${idx}]`)));

                // const orderedValueExpressions = ExpressionBuilder.buildOrderedExpressionsFromText(x.value, aliases);
                // const usedValueIndexes = indexes.filter(idx =>
                //     orderedValueExpressions.some(e => e.expression.includes(`[${idx}]`)));
                    
                return {
                    ...x,
                    keyExpressions: ExpressionBuilder.buildOrderedExpressionsFromText(x.key, aliases),
                    valueExpressions: ExpressionBuilder.buildOrderedExpressionsFromText(x.value, aliases),
                };
            });
    }
}
