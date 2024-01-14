import { CellValue, CellValueExpressions, Expression, QueryResult } from '@app/models';
import { DataExpressionHelpers } from '@app/services';
import { ExpressionEvaluator } from './expression.evaluator';

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
export class CellValueExpressionEvaluator {
    static evaluate(expressions: CellValueExpressions[], queryResult: QueryResult): CellValue[] {
        // CellValueExpressions -> (evaluation) -> { keys[], values[] } -> { key, value }[]
        return expressions.flatMap(x => {
            let keys = this.evaluateExpressions(x.key, x.keyExpressions, queryResult);
            let values = this.evaluateExpressions(x.value, x.valueExpressions, queryResult);

            if (keys.length && values.length && (keys.length !== values.length && values.length !== 1)) {
                throw new Error(`Invalid cell value template which has incorrect number of key-value pairs`);
            }

            return keys.reduce(
                (cellValues, key, keyIdx) =>
                    ([ ...cellValues, { key, value: values.length > 1 ? values[keyIdx] : values[0] } as CellValue ]),
                [] as CellValue[]
            );
        });
    }

    private static evaluateExpressions(textWithExpression: string, expressions: Expression[], queryResult: QueryResult): string[] {
        const expressionResults = ExpressionEvaluator.evaluate(expressions, queryResult);

        return DataExpressionHelpers.replaceExpressions(textWithExpression, expressionResults);
    }
}