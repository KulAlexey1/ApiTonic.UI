import { ExpressionBuilder } from "../../expression-builders";
import { Expression } from '../../../models';

describe('ExpressionBuilder', () => {
    // "A{{ multiply(shortNameIdx, predictionIdx[shortNameIdx]) }}" | "shortNameIdx" | ["shortNames", "predictions"]
    it('buildOrderedExpressionsFromText when no array brackets returns null', () => {
        const result = ExpressionBuilder.buildOrderedExpressionsFromText(
            'A{{ multiply(shortNameIdx, predictionIdx[shortNameIdx]) }}', [], ['shortNameIdx', 'predictionIdx']);
        expect(result)
            .toEqual(new Array<Expression>(
                { expression: 'shortNameIdx', type: 'index' },
                { expression: 'predictionIdx[shortNameIdx]', type: 'indexGroups' },
                { expression: 'multiply(shortNameIdx, predictionIdx[shortNameIdx])', type: 'method' },
            ));
    });
});
