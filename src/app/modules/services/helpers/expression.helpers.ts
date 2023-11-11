export class ExpressionHelpers {
    //method(123, method2(test, method3(abc)), 9)
    static getMethodExpression(input: string): { expression: string, parameters: string[] } | null {
        const methodRegex = /^(\w+)\((.*)\)$/;
        const match = input.match(methodRegex);

        if (!match) {
            return null;
        }

        const expression = match[0];
        const parametersStr = match[2];
        const parameters: string[] = [];
        let param = '';
        let openParenCount = 0;

        for (const char of parametersStr) {
            if (char === ',' && openParenCount === 0) {
                parameters.push(param.trim());
                param = '';
            } else {
                param += char;
                if (char === '(') {
                    openParenCount++;
                } else if (char === ')') {
                    openParenCount--;
                }
            }
        }

        if (param.trim() !== '') {
            parameters.push(param.trim());
        }

        return { expression, parameters };
    }

    //abc data[0][1][2][abc] data
    static getArrayExpression(input: string): { expression: string, arrayName: string, indexes: string[] } | null {
        const arrayExpressionRegex = /(\w+(\[[^\]]+\])+)/;
        const arrayDataRegex = /(\w+)(?=\[)|(\d+)(?=\])|(\w+)(?=\])/g;

        // data[0][1][2][abc]
        const arrayExpressionMatches = input.match(arrayExpressionRegex);
        if (arrayExpressionMatches) {
            // ['data', '0', '1', '2', 'abc']
            const arrayDataMatches = Array.from(arrayExpressionMatches[0].match(arrayDataRegex) || []);

            return {
                expression: arrayExpressionMatches[0],
                arrayName: arrayDataMatches[0],
                indexes: arrayDataMatches?.slice(1)
            }
        }

        return null;
    }
}
