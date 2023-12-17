import { ExpressionResult } from "@app/models";

export class DataExpressionHelpers {
    static replaceExpression(text: string, expression: string, expressionResult: string): string {
        let expressionBracketStartIdx = 0;
        const startBrackets = '{{';
        const endBrackets = '}}';

        while (true) {
            expressionBracketStartIdx = text.indexOf(startBrackets, expressionBracketStartIdx);
            if (expressionBracketStartIdx === -1) {
                break;
            }

            const expressionBracketEndIdx = text.indexOf(endBrackets, expressionBracketStartIdx);

            const someTextExpression = text.substring(expressionBracketStartIdx, expressionBracketEndIdx + endBrackets.length);
            text = text.replaceAll(someTextExpression,
                someTextExpression.replaceAll(expression, expressionResult));

            expressionBracketStartIdx++;
        }

        return text;
    }

    static replaceExpressions(text: string, expressionResults: ExpressionResult[]): string[] {
        return expressionResults
            .reduce(
                (texts, exprRes) => {
                    const t = texts.flatMap(t => 
                        exprRes.result.map(r =>
                            DataExpressionHelpers.replaceExpression(t, exprRes.expression, r)));
                    return t;
                },
                [text] as string[]
            )
            .map(x =>
                x.replaceAll('{{', '').replaceAll('}}', ''));
    }
}
