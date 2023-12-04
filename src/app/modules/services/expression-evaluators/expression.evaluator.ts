import { PredefinedMethodNames, RegularExpressions } from '../../constants';
import { Expression, ExpressionResult, QueryResult } from '../../models';
import { DataAccessor } from '../data/data.accessor';
import { ExpressionHelpers } from '../helpers';

export class ExpressionEvaluator {
    static evaluate(expression: Expression, queryResult: QueryResult): ExpressionResult {
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
        [PredefinedMethodNames.multiply]: this.multiply
    };

    // 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction',
    // buildGraphQLAlias("BTC")
    static evaluate(expression: string): ExpressionResult {
        const startBracketIdx = expression.indexOf('(');
        const endBracketIdx = expression.indexOf(')');
        const methodName = expression.slice(0, startBracketIdx);
        const args = expression.slice(startBracketIdx + 1, endBracketIdx);

        const method = this.methods[methodName];
        if (!method) {
            throw new Error(`The method ${methodName} is not supported or not implemented yet`);
        }

        const methodResult = this.methods[methodName](args);

        return {
            expression,
            result: [ methodResult ]
        };
    }
    
    private static buildGraphQLAlias(alias: string): string {
        return alias.replace( RegularExpressions.notAllowedAliasCharsExpression, () => '_');
    }

    private static multiply(x: number, y: number): string {
        return Math.imul(x, y).toString();
    }
}

class ArrayExpressionEvaluator {
    // shortNames[1]
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        const arrExpr = ExpressionHelpers.getArrayExpression(expression);
        if (!arrExpr) {
            throw new Error('Unexpected error');
        }

        const resultPath = expression.replace(arrExpr.arrayName, result.dataPathByAlias[arrExpr.arrayName]);
        
        return {
            expression,
            result: DataAccessor.getDataByPath(resultPath, result.data)
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
            .find(x => x.indexes.every(idx => idx === expression));
        if (!indexStructure) {
            throw new Error('Invalid index expression containing no actual index');
        }

        return {
            expression,
            result: indexStructure.groups.map(g => g[0].value.toString())
        };
    }
}

class IndexGroupExpressionEvaluator {
    //predictionIdx[1]
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        const arrayExpression = ExpressionHelpers.getArrayExpression(expression);

        //TODO: replace code below with appropriate for index groups
        const indexStructure = result.indexStructure
            .find(x => x.indexes.every(idx => idx === expression));
        if (!indexStructure) {
            throw new Error('Invalid index expression containing no actual index');
        }

        return {
            expression,
            result: indexStructure.groups.map(g => g[0].value.toString())
        };
    }
}

class ValueExpressionEvaluator {
    // shortname
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        return {
            expression,
            result: [ DataAccessor.getDataByPath(result.dataPathByAlias[expression], result.data) ]
        };

        // return queryConfigs.map(c =>
        //     ({ ...c, query: c.query.replace(expression, QueryConfigService.getDataByPath(expression, result.data) ) } as QueryConfig) );
    }
}
