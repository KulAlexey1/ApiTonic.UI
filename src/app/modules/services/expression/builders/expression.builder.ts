import { RegularExpressions } from '@app/constants';
import { Expression } from '@app/models';
import { TextExpressionHelpers } from '@app/services';

export class ExpressionBuilder {
    static buildOrderedExpressionsFromText(textWithExpressions: string, aliases: string[], indexes: string[]): Expression[] {
        const expressions = [ ...new Set(textWithExpressions.match(RegularExpressions.expression)) ]
            .map(x => x.replace('{{', '').replace('}}', '').trim());
        const orderedExpressions = expressions
            .flatMap(x => this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases, indexes));

        return orderedExpressions.filter((expr, index) =>
            index === orderedExpressions.findIndex((e) => e.expression === expr.expression && e.type === expr.type)
        );
    }

    private static buildOrderedExpressionsFromExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        let orderedExpressions = [
            ...this.buildMethodExpression(textWithExpressions, expression, aliases, indexes),
            ...this.buildValueExpression(expression, indexes),
            ...this.buildArrayExpression(textWithExpressions, expression, aliases, indexes),
            ...this.buildIndexExpression(expression, indexes),
            ...this.buildIndexGroupsExpression(textWithExpressions, expression, aliases, indexes)
        ];

        orderedExpressions = orderedExpressions.filter((x, idx) =>
            idx === orderedExpressions.findIndex(y => y.expression === x.expression && y.type === x.type));

        // issue 1: no separate expression for nested method like intDiv(multiply(1, 2), 3) -> no multiply(1, 2)  

        // issue 2: debug the logic below, seems it's working wrong
        orderedExpressions = orderedExpressions.reduce((expressions, expr, exprIdx) => {
            if (expr.type !== 'indexGroups') {
                return expressions;
            }

            const arrExpr = TextExpressionHelpers.getArrayExpression(expr.expression);
            if (arrExpr?.property) {
                const indexGroupWithoutPropertyIdx = expressions.findIndex(x => {
                    if (x.type !== 'indexGroups') {
                        return false;
                    }

                    const arrayExpression = TextExpressionHelpers.getArrayExpression(x.expression);

                    return !arrayExpression?.property
                        && arrayExpression?.arrayName === arrExpr.arrayName
                        && arrayExpression.indexes.length === arrExpr.indexes.length
                        && arrayExpression.indexes.every(idx => arrExpr.indexes.includes(idx));
                });

                //do it only if idx with group > idx without group
                //write test to check it
                if (indexGroupWithoutPropertyIdx !== -1 && exprIdx > indexGroupWithoutPropertyIdx) {
                    return [
                        ...expressions.slice(0, indexGroupWithoutPropertyIdx),
                        expressions[exprIdx], //index group with property
                        expressions[indexGroupWithoutPropertyIdx], //index group without property
                        ...expressions.slice(indexGroupWithoutPropertyIdx + 1, exprIdx),
                        ...expressions.slice(exprIdx + 1)
                    ];
                }
            }

            return expressions;
        }, orderedExpressions);

        return orderedExpressions;
    }

    private static buildMethodExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        const methodExpression = TextExpressionHelpers.getMethodExpression(expression);
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
        const methodExpression = TextExpressionHelpers.getMethodExpression(expression);
        const arrayExpression = TextExpressionHelpers.getArrayExpression(expression);
        if (arrayExpression || methodExpression || indexes.includes(expression)) {
            return [];
        }

        return [ { expression, type: 'value' } ];
    }

    private static buildArrayExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        const arrayExpression = TextExpressionHelpers.getArrayExpression(expression);
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
        const arrayExpression = TextExpressionHelpers.getArrayExpression(expression);
        if (arrayExpression || !indexes.includes(expression)) {
            return [];
        }

        return [ { expression, type: 'index' } ];
    }

    //textWithExpr: "{{shortNames[multiply(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)]}}"
    //expression: "predictionIdx[shortNameIdx]"
    private static buildIndexGroupsExpression(textWithExpressions: string, expression: string, aliases: string[], indexes: string[]): Expression[] {
        let arrayExpression = TextExpressionHelpers.getArrayExpression(expression);
        if (!arrayExpression || aliases.includes(arrayExpression.arrayName) || !indexes.includes(arrayExpression.arrayName)) {
            return [];
        }

        const idxsWithExpression = arrayExpression.indexes.filter(idx => isNaN(+idx));
        return [
            ...idxsWithExpression.flatMap(x =>
                this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases, indexes)),
            { expression: arrayExpression.expression, type: 'indexGroups' }
        ];

        //THE NEW IMPLEMENTATION IS WRONG BECAUSE FLOW LIKE THIS
        // build index expression - [multiply(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)]
        // build method params expressions
        // build index group expression - predictionIdx[shortNameIdx]
        // build index group expression - predictionIdx[shortNameIdx].length
        // build method expression - multiply(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)
        // build array expression - shortNames[multiply(predictionIdx[shortNameIdx], predictionIdx[shortNameIdx].length)]

        //find all expressions of index group with property - how to do it?
        //if exist then buildIndexGroupsExpression for them first and then for current one

        // arrayExpressions = [
        //     ...new Set([
        //         ...arrayExpressions.filter(x => x.property),
        //         ...arrayExpressions.filter(x => !x.property)
        //     ])
        // ];

        // return arrayExpressions.flatMap(arrExpr =>
        //     this.buildIndexGroupsExpressions(textWithExpressions, aliases, indexes, arrExpr));
    }

    // private static buildIndexGroupsExpressions(textWithExpressions: string, aliases: string[], indexes: string[],
    //     arrayExpression: { expression: string, arrayName: string, indexes: string[]; property?: string; }): Expression[] {

    //     const idxsWithExpression = arrayExpression.indexes.filter(idx => isNaN(+idx));
    //     return [
    //         ...idxsWithExpression.flatMap(x =>
    //             this.buildOrderedExpressionsFromExpression(textWithExpressions, x, aliases, indexes)),
    //         { expression: arrayExpression.expression, type: 'indexGroups' }
    //     ];
    // }
}
