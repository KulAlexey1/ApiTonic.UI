import { ExpressionResult } from "@app/models";

export class DataExpressionHelpers {
    static containsExpression(text: string, expression: string): boolean {
        let expressionBracketStartIdx = 0;
        const startBrackets = '{{';
        const endBrackets = '}}';

        while (true) {
            expressionBracketStartIdx = text.indexOf(startBrackets, expressionBracketStartIdx);
            if (expressionBracketStartIdx === -1) {
                return false;
            }

            const expressionBracketEndIdx = text.indexOf(endBrackets, expressionBracketStartIdx);

            const someTextExpression = text.substring(expressionBracketStartIdx, expressionBracketEndIdx + endBrackets.length);
            if (someTextExpression.includes(expression)) {
                return true;
            }

            expressionBracketStartIdx++;
        }
    }

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
                    return texts.flatMap(t => {
                        //exprRes.expression = 'predictionIdx[0]'
                        if (this.containsExpression(t, exprRes.expression)) {
                            return exprRes.result.map(r =>
                                DataExpressionHelpers.replaceExpression(t, exprRes.expression, r));
                        }
                        else {
                            return [t];
                        }
                    });
                },
                [text] as string[]
            )
            .map(x =>
                x.replaceAll('{{', '').replaceAll('}}', ''));
    }
}
