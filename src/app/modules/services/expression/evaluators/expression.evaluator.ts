import { TextExpressionHelpers, DataAccessor } from '@app/services';
import { PredefinedMethodNames, RegularExpressions } from '@app/constants';
import { Expression, ExpressionResult, QueryResult } from '@app/models';

export class ExpressionEvaluator {
    static evaluate(expressions: Expression[], queryResult: QueryResult): ExpressionResult[] {
        let expressionsToEvaluate = [ ...expressions ];
        const expressionResults: ExpressionResult[] = [];
        
        while (expressionsToEvaluate.length) {
            const expression = expressionsToEvaluate.shift() as Expression;

            const expressionResult = this.evaluateExpression(expression, queryResult);
            expressionResults.push(expressionResult);

            expressionsToEvaluate = [
                ...expressionsToEvaluate.filter(x => !x.expression.includes(expression.expression)),
                ...expressionsToEvaluate
                    .filter(x => x.expression.includes(expression.expression) && x.expression !== expression.expression)
                    .flatMap(x =>
                        expressionResult.result.map(r =>
                            ({ ...x, expression: x.expression.replaceAll(expressionResult.expression, r) } as Expression) ))
            ];
        }

        return expressionResults;
    }

    private static evaluateExpression(expression: Expression, queryResult: QueryResult): ExpressionResult {
        switch (expression.type) {
            case 'array':
                return ArrayExpressionEvaluator.evaluate(expression.expression, queryResult);
            case 'value':
                return ValueExpressionEvaluator.evaluate(expression.expression, queryResult);
            case 'method':
                return MethodExpressionEvaluator.evaluate(expression.expression);
            case 'index':
                return IndexExpressionEvaluator.evaluate(expression.expression, queryResult);
            case 'indexGroups':
                return IndexGroupExpressionEvaluator.evaluate(expression.expression, queryResult);
            default:
                throw new Error(`Evaluation of ${expression.type} expression is not implemented yet`);
        }
    }
}

class MethodExpressionEvaluator {
    private static readonly methods: { [name: string]: (...args: any) => string } = {
        [PredefinedMethodNames.buildGraphQLAlias]: this.buildGraphQLAlias,
        [PredefinedMethodNames.multiply]: this.multiply,
        [PredefinedMethodNames.sum]: this.sum,
        [PredefinedMethodNames.intDiv]: this.intDiv

    };

    // 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction',
    // buildGraphQLAlias("BTC")
    static evaluate(expression: string): ExpressionResult {
        const startBracketIdx = expression.indexOf('(');
        const endBracketIdx = expression.indexOf(')');
        const methodName = expression.slice(0, startBracketIdx);
        const argString = expression.slice(startBracketIdx + 1, endBracketIdx);
        const argArray = argString.split(',').map(arg => arg.trim());

        const method = this.methods[methodName];
        if (!method) {
            throw new Error(`The method ${methodName} is not supported or not implemented yet`);
        }

        const methodResult = this.methods[methodName](...argArray);

        return {
            expression,
            result: [ methodResult ]
        };
    }
    
    private static buildGraphQLAlias(alias: string): string {
        return alias.replace( RegularExpressions.notAllowedAliasCharsExpression, () => '_');
    }

    private static multiply(x: string, y: string): string {
        return Math.imul(+x, +y).toString();
    }

    private static sum(x: string, y: string): string {
        return (+x + +y).toString();
    }

    private static intDiv(x: string, y: string): string {
        const result = Math.floor(+x / +y);
        if (isNaN(result)) {
            throw new Error(`The result of ${x} / ${y} is not a number`);
        }
        return Math.floor(+x / +y).toString();
    }
}

class ArrayExpressionEvaluator {
    // shortNames[1]
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        const arrExpr = TextExpressionHelpers.getArrayExpression(expression);
        if (!arrExpr) {
            throw new Error('Unexpected error');
        }

        const resultPath = expression.replace(arrExpr.arrayName, result.dataPathByAlias[arrExpr.arrayName]);
        
        return {
            expression,
            result: [ DataAccessor.getDataByPath(resultPath, result.data) ]
        };
        

        // const usedIndexes = ExpressionHelpers.getArrayExpression(expression)?.indexes;
        // const indexStructure = result.indexStructure.find(x =>
        //     x.indexes.length === usedIndexes?.length && x.indexes.every(y => usedIndexes.includes(y)));
        // const indexGroups = indexStructure?.groups ?? [];

        // const resultExpressions = indexGroups.map(group =>
        //     group.reduce(
        //         (expr, indexValue) =>
        //             expr.replace(`[${indexValue.index}]`, `[${indexValue.value}]`),
        //         expression
        //     )
        // );

        // return {
        //     expression,
        //     result: resultExpressions.map(expr => {
        //         const exprDataPathByAlias = Object.entries(result.dataPathByAlias)
        //             .find(x => expr.includes(x[0])) as [string, string];
                
        //         return DataAccessor.getDataByPath(
        //             expr.replace(exprDataPathByAlias[0], exprDataPathByAlias[1]),
        //             result.data
        //         );   
        //     })
        // };
    }
}

class IndexExpressionEvaluator {
    //shortNameIdx
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        const indexStructure = result.indexStructure
            .find(x => x.index === expression);
        if (!indexStructure || indexStructure.values.length > 1) {
            throw new Error('Invalid index expression containing no actual index or index group');
        }

        return {
            expression,
            result: indexStructure.values[0].map(String)
        };
    }
}

class IndexGroupExpressionEvaluator {
    //predictionIdx[1]
    // predictionIdx[1].length
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        const arrExpr = TextExpressionHelpers.getArrayExpression(expression);
        if (!arrExpr || arrExpr.indexes.length > 1) {
            throw new Error('Unexpected error');
        }

        const indexStructure = result.indexStructure
            .find(x => x.index === arrExpr.arrayName);
        if (!indexStructure) {
            throw new Error('Invalid index expression containing no actual index');
        }

        return {
            expression,
            result: arrExpr.property
                ? [ this.getIndexGroupPropertyValue(indexStructure.values[+arrExpr.indexes[0]], arrExpr.property) ]
                : indexStructure.values[+arrExpr.indexes[0]].map(String)
        };
    }

    private static getIndexGroupPropertyValue(indexGroup: number[], property: string): string {
        switch (property) {
            case 'length':
                return indexGroup[property].toString();
            default:
                throw new Error('Unknown index group property');
        }
    }
}

class ValueExpressionEvaluator {
    // shortname
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        return {
            expression,
            result: [ result.dataPathByAlias[expression] ? DataAccessor.getDataByPath(result.dataPathByAlias[expression], result.data) : expression ]
        };

        // return queryConfigs.map(c =>
        //     ({ ...c, query: c.query.replace(expression, QueryConfigService.getDataByPath(expression, result.data) ) } as QueryConfig) );
    }
}
