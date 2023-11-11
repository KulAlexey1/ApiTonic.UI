import { ExpressionHelpers } from "../../helpers";

describe('ExpressionHelpers', () => {
    it('getArrayExpression when no array brackets returns null', () => {
        const result = ExpressionHelpers.getArrayExpression('data');
        expect(result).toBe(null);
    });

    it('getArrayExpression when one number in array brackets returns result with the index', () => {
        const result = ExpressionHelpers.getArrayExpression('123 arr[0] data');
        expect(result).toEqual({ expression: 'arr[0]', arrayName: 'arr', indexes: ['0'] });
    });

    it('getArrayExpression when one string in array brackets returns result with the index', () => {
        const result = ExpressionHelpers.getArrayExpression('123 arr[var1] data');
        expect(result).toEqual({ expression: 'arr[var1]', arrayName: 'arr', indexes: ['var1'] });
    });

    it('getArrayExpression when multiple array brackets returns result with all indexes', () => {
        const result = ExpressionHelpers.getArrayExpression('abc data[0][1][2][var1] text');
        expect(result).toEqual({ expression: 'data[0][1][2][var1]', arrayName: 'data', indexes: ['0', '1', '2', 'var1'] });
    });


    it('getMethodExpression when no method brackets returns null', () => {
        const result = ExpressionHelpers.getMethodExpression('data');
        expect(result).toBe(null);
    });

    it('getMethodExpression when method with no parameters returns expression and empty parameters array', () => {
        const result = ExpressionHelpers.getMethodExpression('method()');
        expect(result).toEqual({ expression: 'method()', parameters: [] });
    });

    it('getMethodExpression when method with one parameter returns expression and array with the parameter', () => {
        const result = ExpressionHelpers.getMethodExpression('method(123)');
        expect(result).toEqual({ expression: 'method(123)', parameters: [ '123' ] });
    });

    it('getMethodExpression when method with multiple parameters returns expression and array with the parameters', () => {
        const result = ExpressionHelpers.getMethodExpression('method(123, abc, 9)');
        expect(result).toEqual({ expression: 'method(123, abc, 9)', parameters: [ '123', 'abc', '9' ] });
    });

    it('getMethodExpression when method with nested methods as parameters returns expression and array with the parameters', () => {
        const result = ExpressionHelpers.getMethodExpression('method(123, method2(test, method3(abc)), 9)');
        expect(result).toEqual({ expression: 'method(123, method2(test, method3(abc)), 9)', parameters: [ '123', 'method2(test, method3(abc))', '9' ] });
    });
});