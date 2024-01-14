import { Expression } from '@app/models';
import { ExpressionBuilder } from '@app/services';

describe('ExpressionBuilder', () => {
    it('buildOrderedExpressionsFromText when index group with index inside returns index and then index group expressions', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            'A{{ multiply(shortNameIdx, predictionIdx[shortNameIdx]) }}', [], ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                { expression: 'shortNameIdx', type: 'index' },
                { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups' },
                { expression: 'multiply(shortNameIdx, predictionIdx[shortNameIdx])', type: 'method' },
            ));
    });

    // {{ shortNames[ intDiv( multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length ) ] }}
    it('buildOrderedExpressionsFromText when complex expression inside array brackets returns expressions from brackets and then array expression', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            '{{shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx])]}}',
            ['shortNames'],
            ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                { expression: 'shortNameIdx', type: 'index'},
                { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups'},
                { expression: 'multiply(shortNameIdx, predictionIdx[shortNameIdx])', type: 'method'},
                { expression: 'intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx])', type: 'method'},
                { expression: 'shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx])]', type: 'array'},
            ));
    });

    it('buildOrderedExpressionsFromText when index group with property returns single expression for index group with length', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            '{{predictionIdx[shortNameIdx].length}}',
            [],
            ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                { expression: 'shortNameIdx', type: 'index'},
                { expression: 'predictionIdx[shortNameIdx].length', type: 'indexGroups'},
            ));
    });

    it('buildOrderedExpressionsFromText when index group, another one with property and some expression between them returns index group with property first', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            '{{shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)]}}',
            ['shortNames'],
            ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                    { expression: 'shortNameIdx', type: 'index'},
                    { expression: 'predictionIdx[shortNameIdx].length', type: 'indexGroups'},
                    { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups'},
                    { expression: 'multiply(shortNameIdx, predictionIdx[shortNameIdx])', type: 'method'},
                    { expression: 'intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)', type: 'method'},
                    { expression: 'shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)]', type: 'array'}
                ));
    });

    it('buildOrderedExpressionsFromText when index group right after another one with property returns index group with property first', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            '{{shortNames[intDiv(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)]}}',
            ['shortNames'],
            ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                    { expression: 'shortNameIdx', type: 'index'},
                    { expression: 'predictionIdx[shortNameIdx].length', type: 'indexGroups'},
                    { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups'},
                    { expression: 'intDiv(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)', type: 'method'},
                    { expression: 'shortNames[intDiv(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)]', type: 'array'}
                ));
    });

    it('buildOrderedExpressionsFromText when index group right after another one with property and no expressions after returns index group without property first', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            '{{predictionIdx[predictionIdx[shortNameIdx]].length]}}',
            ['shortNames'],
            ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                    { expression: 'shortNameIdx', type: 'index'},
                    { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups'},
                    { expression: 'predictionIdx[predictionIdx[shortNameIdx]].length]', type: 'indexGroups'},
                ));
    });

    it('buildOrderedExpressionsFromText when index group with property first and then index group without it returns index group with property first', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            '{{multiply(predictionIdx[shortNameIdx].length, predictionIdx[shortNameIdx])}}',
            ['shortNames'],
            ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                    { expression: 'shortNameIdx', type: 'index'},
                    { expression: 'predictionIdx[shortNameIdx].length', type: 'indexGroups'},
                    { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups'},
                    { expression: 'multiply(predictionIdx[shortNameIdx].length, predictionIdx[shortNameIdx])', type: 'method'},
                ));
    });

    it('buildOrderedExpressionsFromText when index group first and then index group with property returns index group with property first', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            '{{multiply(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)}}',
            ['shortNames'],
            ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                    { expression: 'shortNameIdx', type: 'index'},
                    { expression: 'predictionIdx[shortNameIdx].length', type: 'indexGroups'},
                    { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups'},
                    { expression: 'multiply(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)', type: 'method'},
                ));
    });

    it('buildOrderedExpressionsFromText when method is nested in another method', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText('{{intDiv(multiply(1, 2), 3)}}', [], []);
        expect(result)
            .toEqual(new Array<Expression>(
                    { expression: '1', type: 'value'},
                    { expression: '2', type: 'value'},
                    { expression: 'multiply(1, 2)', type: 'method'},
                    { expression: '3', type: 'value'},
                    { expression: 'intDiv(multiply(1, 2), 3)', type: 'method'}
                ));
    });
});
