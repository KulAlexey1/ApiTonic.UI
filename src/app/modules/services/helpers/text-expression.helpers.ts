export class TextExpressionHelpers {
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

    //shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)]
    //returns only first array expression in input
    static getArrayExpression(input: string): { expression: string, arrayName: string, indexes: string[]; property?: string; } | null {
        let insideBracket = 0;
        let arrayName = '';
        let currentIndex = '';
        let indexes: string[] = [];
        // let [arrayExpression, property] = input.split('.');

        for (let char of input) {
            //first [
            if (char === '[' && arrayName && insideBracket === 0) {
                insideBracket++;

                continue;
            }

            //nested [
            if (char === '[' && arrayName && insideBracket > 0) {
                currentIndex += char;
                insideBracket++;

                continue;
            }

            //nested ]
            if (char === ']' && insideBracket > 1) {
                insideBracket--;
                currentIndex += char;

                continue;
            }

            //last ]
            if (char === ']' && insideBracket === 1) {
                indexes.push(currentIndex);
                insideBracket--;
                currentIndex = '';

                continue;
            }

            //between first [ and last ]
            if (insideBracket > 0) {
                currentIndex += char;

                continue;
            }

            //abc test[1]
            if (char === ' ' && indexes.length === 0) {
                arrayName = '';

                continue;
            }

            //test[1]abc qwer[2]
            if (char !== ' ' && char !== '.' && char !== '[' && indexes.length > 0) {
                arrayName += char;
                indexes = [];

                continue;
            }

            //test[1] abc
            if ((char === ' ' || char === '.') && indexes.length > 0) {
                break;
            }
            
            arrayName += char;
        }

        if (arrayName === '' || indexes.length === 0 || insideBracket !== 0) {
            return null;
        }

        const expression = `${arrayName}[${indexes.join('][')}]`;
        const propertyExpression = input.replace(expression, '');
        const property = propertyExpression.startsWith('.') && propertyExpression.length > 1
            ? propertyExpression.substring(1)
            : '';

        return { expression: expression + (property ? propertyExpression : ''), arrayName, indexes, ...(property ? { property } : {}) };
    }
}
