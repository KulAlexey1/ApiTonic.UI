import { DataExpressionHelpers } from "@app/services";

describe('DataExpressionHelpers', () => {
    it('replaceExpressionPart when an expression is used twice in the text then the expression is replaced in these two places', () => {
        const result = DataExpressionHelpers.replaceExpression(
            'coinCodex.{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
            'shortNames[shortNameIdx]',
            'BTC');
        expect(result).toEqual('coinCodex.{{buildGraphQLAlias(BTC)}}: prediction(shortname: "{{BTC}}").thirtyDayPrediction');
    });

    it('replaceExpressionPart when an expression is used twice in and outside the brackets then only the text inside the brackets is replaced', () => {
        const result = DataExpressionHelpers.replaceExpression(
            'coinCodex.shortNames[shortNameIdx].{{buildGraphQLAlias(shortNames[shortNameIdx])}}: prediction(shortname: "{{shortNames[shortNameIdx]}}").thirtyDayPrediction',
            'shortNames[shortNameIdx]',
            'BTC');
        expect(result).toEqual('coinCodex.shortNames[shortNameIdx].{{buildGraphQLAlias(BTC)}}: prediction(shortname: "{{BTC}}").thirtyDayPrediction');
    });

    it('replaceExpressionPart when no expressions returns the same text', () => {
        const result = DataExpressionHelpers.replaceExpression(
            'coinCodex.shortNames[shortNameIdx].thirtyDayPrediction',
            'shortNames[shortNameIdx]',
            'BTC');
        expect(result).toEqual('coinCodex.shortNames[shortNameIdx].thirtyDayPrediction');
    });
});