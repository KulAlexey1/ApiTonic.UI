import { TextExpressionHelpers } from "@app/services";

describe('TextExpressionHelpers', () => {
    it('getArrayExpression when no array brackets returns null', () => {
        const result = TextExpressionHelpers.getArrayExpression('data');
        expect(result).toBe(null);
    });

    it('getArrayExpression when one number in array brackets returns result with the index', () => {
        const result = TextExpressionHelpers.getArrayExpression('123 arr[0] data');
        expect(result).toEqual({ expression: 'arr[0]', arrayName: 'arr', indexes: ['0'] });
    });

    it('getArrayExpression when one string in array brackets returns result with the index', () => {
        const result = TextExpressionHelpers.getArrayExpression('123 arr[var1] data');
        expect(result).toEqual({ expression: 'arr[var1]', arrayName: 'arr', indexes: ['var1'] });
    });

    it('getArrayExpression when multiple array brackets returns result with all indexes', () => {
        const result = TextExpressionHelpers.getArrayExpression('abc data[0][1][2][var1] text');
        expect(result).toEqual({ expression: 'data[0][1][2][var1]', arrayName: 'data', indexes: ['0', '1', '2', 'var1'] });
    });

    it('getArrayExpression when array brackets dont used as array returns result without the brackets', () => {
        const result = TextExpressionHelpers.getArrayExpression('test[1]abc qwer[2]');
        expect(result).toEqual({ expression: 'qwer[2]', arrayName: 'qwer', indexes: ['2'] });
    });

    it('getArrayExpression when only [ bracket is used returns null', () => {
        const result = TextExpressionHelpers.getArrayExpression('test[');
        expect(result).toBe(null);
    });

    it('getArrayExpression when only ] bracket is used returns null', () => {
        const result = TextExpressionHelpers.getArrayExpression('test]');
        expect(result).toBe(null);
    });

    it('getArrayExpression when some text after array expression returns only array expression', () => {
        const result = TextExpressionHelpers.getArrayExpression('test[1] abc');
        expect(result).toEqual({ expression: 'test[1]', arrayName: 'test', indexes: ['1'] });
    });

    it('getArrayExpression when some property after array expression returns array expression and property', () => {
        const result = TextExpressionHelpers.getArrayExpression('predictionIdx[shortNameIdx].length');
        expect(result)
            .toEqual({
                expression: 'predictionIdx[shortNameIdx].length',
                arrayName: 'predictionIdx',
                indexes: ['shortNameIdx'],
                property: 'length'
            });
    });

    it('getArrayExpression when string in array brackets has nested array brackets returns result with the first index', () => {
        const result = TextExpressionHelpers.getArrayExpression(
            'shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)]');
        expect(result)
            .toEqual({
                expression: 'shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)]',
                arrayName: 'shortNames',
                indexes: ['intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)']
            });
    });


    it('getMethodExpression when no method brackets returns null', () => {
        const result = TextExpressionHelpers.getMethodExpression('data');
        expect(result).toBe(null);
    });

    it('getMethodExpression when method with no parameters returns expression and empty parameters array', () => {
        const result = TextExpressionHelpers.getMethodExpression('method()');
        expect(result).toEqual({ expression: 'method()', parameters: [] });
    });

    it('getMethodExpression when method with one parameter returns expression and array with the parameter', () => {
        const result = TextExpressionHelpers.getMethodExpression('method(123)');
        expect(result).toEqual({ expression: 'method(123)', parameters: [ '123' ] });
    });

    it('getMethodExpression when method with multiple parameters returns expression and array with the parameters', () => {
        const result = TextExpressionHelpers.getMethodExpression('method(123, abc, 9)');
        expect(result).toEqual({ expression: 'method(123, abc, 9)', parameters: [ '123', 'abc', '9' ] });
    });

    it('getMethodExpression when method with nested methods as parameters returns expression and array with the parameters', () => {
        const result = TextExpressionHelpers.getMethodExpression('method(123, method2(test, method3(abc)), 9)');
        expect(result).toEqual({ expression: 'method(123, method2(test, method3(abc)), 9)', parameters: [ '123', 'method2(test, method3(abc))', '9' ] });
    });
});