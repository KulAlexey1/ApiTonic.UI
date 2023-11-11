import { RegularExpressions } from '../../constants';
import { Expression } from '../../models';
import { ExpressionHelpers } from '../helpers';

export class ExpressionBuilder {
    static buildOrderedExpressionsFromText(textWithExpressions: string, aliases: string[]): Expression[] {
        const expressions = [ ...new Set(textWithExpressions.match(RegularExpressions.expression)) ]
            .map(x => x.replace('{{', '').replace('}}', ''));
        const orderedExpressions = expressions
            .flatMap(x => this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases));

        return orderedExpressions.filter((expr, index) =>
            index === orderedExpressions.findIndex((e) => e.expression === expr.expression && e.type === expr.type)
        );
    }

    //what should be returned for - buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    //coinCodex.coinList.data[coinIdx].shortname
    //buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)
    //123
    //buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    private static buildOrderedExpressionsFromExpression(textWithExpressions: string, expression: string, aliases: string[]): Expression[] {
        const orderedExpressions: Expression[] = [];
    
        const methodExpression = ExpressionHelpers.getMethodExpression(expression);
        // if (methodExpressions?.length && methodExpressions?.length > 1) {
        //     throw new Error(`Invalid expression containing multiple methods: ${expression}. Query: ${textWithExpressions}.`);
        // }

        if (methodExpression) {
            orderedExpressions.push(
                ...methodExpression.parameters.flatMap(mp => this.buildOrderedExpressionsFromExpression(textWithExpressions, mp, aliases)),
                { expression: methodExpression.expression, type: 'method' } as Expression
            );
        } else {
            const arrayExpression = ExpressionHelpers.getArrayExpression(expression);
            // if (arrayExpressions?.length && arrayExpressions?.length > 1) {
            //     throw new Error(`Invalid expression containing multiple arrays: ${expression}. Text: ${textWithExpressions}.`);
            // }
    
            if (arrayExpression) {
                if (!aliases.includes(arrayExpression.arrayName)) {
                    throw new Error(`Invalid expression containing no alias: ${arrayExpression.expression}. Text: ${textWithExpressions}`);
                }

                orderedExpressions.push({ expression: arrayExpression.expression, type: 'array' } as Expression);
            } else {
                if (!aliases.includes(expression)) {
                    throw new Error(`Invalid expression containing no alias: ${expression}. Text: ${textWithExpressions}`);
                }

                orderedExpressions.push({ expression: expression, type: 'value' } as Expression);
            }
        }

        return [ ...new Set(orderedExpressions) ];
    }
}
