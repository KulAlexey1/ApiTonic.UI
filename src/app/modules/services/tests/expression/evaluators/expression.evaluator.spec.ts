import { ExpressionResult } from '@app/models';
import { ExpressionEvaluator } from 'app/modules/services/expression';

describe('ExpressionEvaluator', () => {
    it('evaluate when different expressions returns result for each', () => {
        const result = ExpressionEvaluator.evaluate(
            [
                {
                    'expression': 'shortNameIdx',
                    'type': 'index'
                },
                {
                    'expression': 'predictionIdx[shortNameIdx].length',
                    'type': 'indexGroups'
                },
                {
                    'expression': 'predictionIdx[shortNameIdx]',
                    'type': 'indexGroups'
                },
                {
                    'expression': 'multiply(shortNameIdx, predictionIdx[shortNameIdx])',
                    'type': 'method'
                },
                {
                    'expression': 'intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)',
                    'type': 'method'
                },
                {
                    'expression': 'shortNames[intDiv(multiply(shortNameIdx, predictionIdx[shortNameIdx]), predictionIdx[shortNameIdx].length)]',
                    'type': 'array'
                }
            ],
            {
                data: {
                    coinCodex: {
                        coinList: {
                            data: [
                                { 
                                    shortname: 'bitcoin'
                                },
                                { 
                                    shortname: 'ethereum'
                                }
                            ]
                        },
                        bitcoin: {
                            thirtyDayPrediction: [
                                [123, 111.111, 1],
                                [345, 222.222, 2]
                            ]
                        },
                        ethereum: {
                            thirtyDayPrediction: [
                                [999, 999.999, 9],
                                [888, 888.888, 8],
                                [777, 777.777, 7]
                            ]
                        }
                    }
                },
                dataPathByAlias: {
                    'predictions[0]': 'coinCodex.bitcoin: prediction(shortname: \'bitcoin\').thirtyDayPrediction',
                    'predictions[1]': 'coinCodex.bitcoin: prediction(shortname: \'ethereum\').thirtyDayPrediction',
                    'shortNames': 'coinCodex.coinList.data.shortname'
                },
                indexStructure: [
                    {
                        index: 'shortNameIdx',
                        values: [ [0, 1] ]
                    },
                    {
                        index: 'predictionIdx',
                        values: [
                            [0, 1],
                            [0, 1, 2]
                        ]
                    }
                ]
            }
        );

        expect(result)
            .toEqual(new Array<ExpressionResult>(
                {
                    'expression': 'shortNameIdx',
                    'result': ['0', '1']
                },
                {
                    'expression': 'predictionIdx[0].length',
                    'result': ['2']
                },
                {
                    'expression': 'predictionIdx[1].length',
                    'result': ['3']
                },
                {
                    'expression': 'predictionIdx[0]',
                    'result': ['0', '1']
                },
                {
                    'expression': 'predictionIdx[1]',
                    'result': ['0', '1', '2']
                },
                {
                    'expression': 'multiply(0, 0)',
                    'result': ['0']
                },
                {
                    'expression': 'multiply(0, 1)',
                    'result': ['0']
                },
                {
                    'expression': 'multiply(1, 0)',
                    'result': ['0']
                },
                {
                    'expression': 'multiply(1, 1)',
                    'result': ['1']
                },
                {
                    'expression': 'multiply(1, 2)',
                    'result': ['2']
                },
                {
                    'expression': 'intDiv(0, 2)',
                    'result': ['0']
                },
                {
                    'expression': 'intDiv(0, 3)',
                    'result': ['0']
                },
                {
                    'expression': 'intDiv(1, 3)',
                    'result': ['0']
                },
                {
                    'expression': 'intDiv(2, 3)',
                    'result': ['0']
                },
                {
                    'expression': 'shortNames[0]',
                    'result': ['bitcoin']
                }
            ));
    })
});
