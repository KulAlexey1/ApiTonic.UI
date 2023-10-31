import { PredefinedMethodNames, RegularExpressions } from '../../constants';
import { Expression, ExpressionResult, QueryResult } from '../../models';
import { DataAccessor } from '../data/data.accessor';

export class ExpressionEvaluator {
    static evaluate(expression: Expression, queryResult: QueryResult): ExpressionResult {
        switch (expression.type) {
            case 'array':
                return ArrayExpressionEvaluator.evaluate(expression.expression, queryResult);
            case 'value':
                return ValueExpressionEvaluator.evaluate(expression.expression, queryResult);
            case 'method':
                return MethodExpressionEvaluator.evaluate(expression.expression);
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
    // shortNames[shortNameIdx]
    static evaluate(expression: string, result: QueryResult): ExpressionResult {
        const usedIndexes = expression.match(RegularExpressions.arrayExpression)
            ?.map(x => x.slice(1, x.length - 1));
        const indexStructure = result.indexStructure.find(x =>
            x.indexes.length === usedIndexes?.length && x.indexes.every(y => usedIndexes.includes(y)));
        const indexGrops = indexStructure?.groups ?? [];

        const resultExpressions = indexGrops.map(group =>
            group.reduce(
                (expression, indexValue) =>
                    expression.replace(`[${indexValue.index}]`, `[${indexValue.value}]`),
                expression
            )
        );

        return {
            expression,
            result: resultExpressions.map(expr =>
                DataAccessor.getDataByPath(result.dataPathByAlias[expr], result.data))
        };

        // const readyExpressions = indexGrops.map(group =>
        //     group.reduce(
        //         (expression, indexValue) =>
        //             expression.replace(`[${indexValue.index}]`, `[${indexValue.value}]`),
        //         expression
        //     )
        // );

        // return queryConfigs.flatMap(c =>
        //     readyExpressions.map(expr =>
        //         ({ ...c, query: c.query.replace(expression, QueryConfigService.getDataByPath(expr, result.data) ) } as QueryConfig) ));


        // expr -> expression[]
        // queryconfig[] + expression[] -> queryconfig[]

        // get data by expression
        // replace expression with data in queryConfigs.query
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
