import { RegularExpressions } from '../../constants';
import { Expression } from '../../models';

export class ExpressionBuilder {
    static buildOrderedExpressionsFromText(textWithExpressions: string, aliases: string[]): Expression[] {
        const expressions = [ ...new Set(textWithExpressions.match(RegularExpressions.expression)) ];
        const orderedExpressions = expressions
            .flatMap(x => this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases));
        
        return orderedExpressions;
    }

    //what should be returned for - buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    //coinCodex.coinList.data[coinIdx].shortname
    //buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)
    //123
    //buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    private static buildOrderedExpressionsFromExpression(textWithExpressions: string, expression: string, aliases: string[]): Expression[] {
        const orderedExpressions: Expression[] = [];
    
        const methodExpressions = expression.match(RegularExpressions.methodExpression);
        if (methodExpressions?.length && methodExpressions?.length > 1) {
            throw new Error(`Invalid expression containing multiple methods: ${expression}. Query: ${textWithExpressions}.`);
        }
        
        if (methodExpressions?.length) {
            const methodExpression = methodExpressions[0];
            const methodParams = methodExpression.split(',').map(x => x.trim());

            orderedExpressions.push(
                ...methodParams.flatMap(mp => this.buildOrderedExpressionsFromExpression(textWithExpressions, mp, aliases)),
                { expression: methodExpression, type: 'method' } as Expression
            );
        } else {
            const arrayExpressions = expression.match(RegularExpressions.arrayExpression);
            if (arrayExpressions?.length && arrayExpressions?.length > 1) {
                throw new Error(`Invalid expression containing multiple arrays: ${expression}. Text: ${textWithExpressions}.`);
            }
            
            if (arrayExpressions?.length) {
                const arrayExpressionWithoutBrackets = arrayExpressions[0].replace(RegularExpressions.arrayExpression, '');

                if (!aliases.includes(arrayExpressionWithoutBrackets)) {
                    throw new Error(`Invalid expression containing no alias: ${arrayExpressions[0]}. Text: ${textWithExpressions}`);
                }

                orderedExpressions.push({ expression: arrayExpressions[0], type: 'array' } as Expression);
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
