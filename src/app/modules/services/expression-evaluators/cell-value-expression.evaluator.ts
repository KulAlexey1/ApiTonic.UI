import { CellValue, CellValueExpressions, Expression, QueryResult } from '../../models';
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

    private static evaluateExpressions(data: string, expressions: Expression[], queryResult: QueryResult): string[] {
        let resultData = [data];

        while (expressions.length) {
            const exprToEvaluate = expressions.shift() as Expression;
            const exprRes = ExpressionEvaluator.evaluate(exprToEvaluate, queryResult);

            resultData = exprRes.result.flatMap(r =>
                resultData.map(k => k.replace(exprRes.expression, r)));
            expressions = expressions.flatMap(x =>
                exprRes.result.map(r =>
                    ({ ...x, expression: x.expression.replace(exprRes.expression, r) } as Expression)));
        }

        return resultData;
    }
}