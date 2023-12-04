import { RegularExpressions } from '../../constants';
import { Expression } from '../../models';
import { ExpressionHelpers } from '../helpers';

export class ExpressionBuilder {
    static buildOrderedExpressionsFromText(textWithExpressions: string, aliases: string[], indexes: string[]): Expression[] {
        const expressions = [ ...new Set(textWithExpressions.match(RegularExpressions.expression)) ]
            .map(x => x.replace('{{', '').replace('}}', '').trim());
        console.log(expressions);
        const orderedExpressions = expressions
            .flatMap(x => this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases, indexes));

        return orderedExpressions.filter((expr, index) =>
            index === orderedExpressions.findIndex((e) => e.expression === expr.expression && e.type === expr.type)
        );
    }

    //what should be returned for - buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    //coinCodex.coinList.data[coinIdx].shortname
    //buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)
    //123
    //buildGraphQLAlias(buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname), 123)
    private static buildOrderedExpressionsFromExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        const orderedExpressions = [
            ...this.buildMethodExpression(textWithExpressions, expression, aliases, indexes),
            ...this.buildValueExpression(expression, indexes),
            ...this.buildArrayExpression(textWithExpressions, expression, aliases, indexes),
            ...this.buildIndexExpression(expression, indexes),
            ...this.buildIndexGroupsExpression(textWithExpressions, expression, aliases, indexes)
        ];

        return orderedExpressions.filter((x, idx) =>
            idx === orderedExpressions.findIndex(y => y.expression === x.expression && y.type === x.type));


        // const orderedExpressions: Expression[] = [];
    
        // const methodExpression = ExpressionHelpers.getMethodExpression(expression);
        // // if (methodExpressions?.length && methodExpressions?.length > 1) {
        // //     throw new Error(`Invalid expression containing multiple methods: ${expression}. Query: ${textWithExpressions}.`);
        // // }

        // if (methodExpression) {
        //     orderedExpressions.push(
        //         ...methodExpression.parameters.flatMap(mp =>
        //             this.buildOrderedExpressionsFromExpression(textWithExpressions, mp, aliases, indexes)),
        //         { expression: methodExpression.expression, type: 'method' } as Expression
        //     );
        // } else {
        //     const arrayExpression = ExpressionHelpers.getArrayExpression(expression);
        //     // if (arrayExpressions?.length && arrayExpressions?.length > 1) {
        //     //     throw new Error(`Invalid expression containing multiple arrays: ${expression}. Text: ${textWithExpressions}.`);
        //     // }
        //     if (!arrayExpression && !aliases.includes(expression) && !indexes.includes(expression)) {
        //         throw new Error(`Invalid expression containing no alias and index: ${expression}. Text: ${textWithExpressions}`);
        //     }

        //     if (arrayExpression && !aliases.includes(arrayExpression.arrayName) && !indexes.includes(arrayExpression.arrayName)) {
        //         throw new Error(`Invalid expression containing no alias and index: ${arrayExpression.expression}. Text: ${textWithExpressions}`);
        //     }

        //     if (arrayExpression) {
        //         if (aliases.includes(arrayExpression.arrayName)) {
        //             orderedExpressions.push({ expression: arrayExpression.expression, type: 'array' } as Expression);
        //             return;
        //         }

        //         if (indexes.includes(arrayExpression.arrayName)) {
        //             arrayExpression.indexes.filter(idx => indexes.includes(idx));

        //             orderedExpressions.push({ expression: arrayExpression.expression, type: 'indexGroups' } as Expression);
        //             return;
        //         }
        //     } else {
        //         if (indexes.includes(expression)) {
        //             orderedExpressions.push({ expression, type: 'index' } as Expression);
        //             return;
        //         }

        //         if (!indexes.includes(expression)) {
        //             orderedExpressions.push({ expression, type: 'value' } as Expression);
        //             return;
        //         }
        //     }
            

        //     // if (!arrayExpression) {
        //     //     if (!aliases.includes(expression)) {
        //     //         throw new Error(`Invalid expression containing no alias: ${expression}. Text: ${textWithExpressions}`);
        //     //     }

        //     //     orderedExpressions.push({ expression: expression, type: 'value' } as Expression);
        //     // }
    

        //     // if (arrayExpression) {
        //     //     if (aliases.includes(arrayExpression.arrayName)) {
        //     //         orderedExpressions.push({ expression: arrayExpression.expression, type: 'array' } as Expression);

        //     //         // throw new Error(`Invalid expression containing no alias: ${arrayExpression.expression}. Text: ${textWithExpressions}`);
        //     //     }

        //     // } else {
        //     //     //fails here when expression is index (shortNameIdx)
        //     //     if (!aliases.includes(expression)) {
        //     //         throw new Error(`Invalid expression containing no alias: ${expression}. Text: ${textWithExpressions}`);
        //     //     }

        //     //     orderedExpressions.push({ expression: expression, type: 'value' } as Expression);
        //     // }
        // }

        // return [ ...new Set(orderedExpressions) ];
    }

    private static buildMethodExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        const methodExpression = ExpressionHelpers.getMethodExpression(expression);
        if (!methodExpression) {
            return [];
        }

        return [
            ...methodExpression.parameters.flatMap(mp =>
                this.buildOrderedExpressionsFromExpression(textWithExpressions, mp, aliases, indexes)),
            { expression: methodExpression.expression, type: 'method' } as Expression
        ];
    }

    private static buildValueExpression(expression: string, indexes: string[]): Expression[] {
        // add ExpressionHelpers.getValueExpression instead
        const arrayExpression = ExpressionHelpers.getArrayExpression(expression);
        if (arrayExpression || indexes.includes(expression)) {
            return [];
        }

        return [ { expression, type: 'value' } ];
    }

    private static buildArrayExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        const arrayExpression = ExpressionHelpers.getArrayExpression(expression);
        if (!arrayExpression || !aliases.includes(arrayExpression.arrayName) || indexes.includes(arrayExpression.arrayName)) {
            return [];
        }

        const idxsWithExpression = arrayExpression.indexes.filter(idx => isNaN(+idx));
        return [
            ...idxsWithExpression.flatMap(x =>
                this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases, indexes)),
            { expression: arrayExpression.expression, type: 'array' }
        ];
    }

    private static buildIndexExpression(expression: string, indexes: string[]): Expression[] {
        // add ExpressionHelpers.getValueExpression instead
        const arrayExpression = ExpressionHelpers.getArrayExpression(expression);
        if (arrayExpression) {
            return [];
        }

        if (!indexes.includes(expression)) {
            return [];
        }

        return [ { expression, type: 'index' } ];
    }

    private static buildIndexGroupsExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        const arrayExpression = ExpressionHelpers.getArrayExpression(expression);
        if (!arrayExpression || aliases.includes(arrayExpression.arrayName) || !indexes.includes(arrayExpression.arrayName)) {
            return [];
        }

        const idxsWithExpression = arrayExpression.indexes.filter(idx => isNaN(+idx));
        return [
            ...idxsWithExpression.flatMap(x =>
                this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases, indexes)),
            { expression: arrayExpression.expression, type: 'indexGroups' }
        ];
    }
}
