import { ExpressionResult } from "@app/models";
import { DataExpressionHelpers } from "@app/services";

describe('DataExpressionHelpers', () => {
    it('replaceExpression when an expression is used twice in the text then the expression is replaced in these two places', () => {
        const result = DataExpressionHelpers.replaceExpression(
            'coinCodex.{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
            'shortNames[shortNameIdx]',
            'BTC');
        expect(result).toEqual('coinCodex.{{buildGraphQLAlias(BTC)}}: prediction(shortname: "{{BTC}}").thirtyDayPrediction');
    });

    it('replaceExpression when an expression is used twice in and outside the brackets then only the text inside the brackets is replaced', () => {
        const result = DataExpressionHelpers.replaceExpression(
            'coinCodex.shortNames[shortNameIdx].{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
            'shortNames[shortNameIdx]',
            'BTC');
        expect(result).toEqual('coinCodex.shortNames[shortNameIdx].{{buildGraphQLAlias(BTC)}}: prediction(shortname: "{{BTC}}").thirtyDayPrediction');
    });

    it('replaceExpression when no expressions returns the same text', () => {
        const result = DataExpressionHelpers.replaceExpression(
            'coinCodex.shortNames[shortNameIdx].thirtyDayPrediction',
            'shortNames[shortNameIdx]',
            'BTC');
        expect(result).toEqual('coinCodex.shortNames[shortNameIdx].thirtyDayPrediction');
    });

    it('replaceExpressions when there are index and index group expressions returns result', () => {
        const expressionResults: ExpressionResult[] = [
            {
                expression: 'shortNameIdx',
                result: [ '0', '1' ]
            },
            {
                expression: 'predictionIdx[0]',
                result: [ '0', '1' ]
            },
            {
                expression: 'predictionIdx[1]',
                result: [ '0', '1', '2' ]
            },
            {
                expression: 'multiply(0, 0)',
                result: [ '0' ]
            },
            {
                expression: 'multiply(0, 1)',
                result: [ '0' ]
            },
            {
                expression: 'multiply(1, 0)',
                result: [ '0' ]
            },
            {
                expression: 'multiply(1, 1)',
                result: [ '1' ]
            },
            {
                expression: 'multiply(1, 2)',
                result: [ '2' ]
            }
        ];
        const result = DataExpressionHelpers.replaceExpressions('A{{multiply(shortNameIdx, predictionIdx[shortNameIdx])}}', expressionResults);

        expect(result)
            .toEqual([
                'A0',
                'A0',
                'A0',
                'A1',
                'A2'
            ]);
    });

    it('replaceExpressions when there is index and index group with property expressions returns result', () => {
        const expressionResults: ExpressionResult[] = [
            {
                expression: 'shortNameIdx',
                result: [ '0', '1' ]
            },

            {
                expression: 'predictionIdx[0].length',
                result: [ '2' ]
            },
            {
                expression: 'predictionIdx[1].length',
                result: [ '3' ]
            },

            {
                expression: 'predictionIdx[0]',
                result: [ '0', '1' ]
            },
            {
                expression: 'predictionIdx[1]',
                result: [ '0', '1', '2' ]
            },

            {
                expression: 'multiply(0, 2)',
                result: [ '0' ]
            },
            {
                expression: 'multiply(1, 2)',
                result: [ '2' ]
            },

            {
                expression: 'multiply(0, 3)',
                result: [ '0' ]
            },
            {
                expression: 'multiply(1, 3)',
                result: [ '3' ]
            },
            {
                expression: 'multiply(2, 3)',
                result: [ '6' ]
            }
        ];
        const result = DataExpressionHelpers.replaceExpressions('A{{multiply(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)}}', expressionResults);

        expect(result)
            .toEqual([
                'A0',
                'A2',
                'A0',
                'A3',
                'A6'
            ]);
    });

    it('containsExpression when there is expression in text returns true', () => {
        const result = DataExpressionHelpers.containsExpression('A{{shortNameIdx}}', 'shortNameIdx');

        expect(result).toBe(true);
    });

    it('containsExpression when there is no expression in text returns false', () => {
        const result = DataExpressionHelpers.containsExpression('A', 'shortNameIdx');

        expect(result).toBe(false);
    });

    it('containsExpression when there is different expression in text returns false', () => {
        const result = DataExpressionHelpers.containsExpression('A{{ predictionIdx[0] }}', 'shortNameIdx');

        expect(result).toBe(false);
    });
});