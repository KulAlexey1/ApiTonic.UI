import { DataAccessor } from "@app/services";

describe('DataAccessor', () => {
    it('getDataByPath when array data and path returns array', () => {
        const result = DataAccessor.getDataByPath(
            'coinCodex.coinList.data.shortname',
            {
                "coinCodex": {
                    "__typename": "CoinCodexQuery",
                    "coinList": {
                        "__typename": "CcCoinListResult",
                        "data": [
                            {
                                "__typename": "CcCoin",
                                "shortname": "bitcoin"
                            },
                            {
                                "__typename": "CcCoin",
                                "shortname": "ethereum"
                            }
                        ]
                    }
                }
            }
        );

        expect(result).toEqual([ 'bitcoin', 'ethereum' ]);
    });

    it('getDataByPath when array data and path for single item returns single item', () => {
        const result = DataAccessor.getDataByPath(
            'coinCodex.coinList.data.shortname[1]',
            {
                "coinCodex": {
                    "__typename": "CoinCodexQuery",
                    "coinList": {
                        "__typename": "CcCoinListResult",
                        "data": [
                            {
                                "__typename": "CcCoin",
                                "shortname": "bitcoin"
                            },
                            {
                                "__typename": "CcCoin",
                                "shortname": "ethereum"
                            }
                        ]
                    }
                }
            }
        );

        expect(result).toEqual('ethereum');
    });

    it('getDataByPath when array data and path with alias in between of the path returns array', () => {
        const result = DataAccessor.getDataByPath(
            "coinCodex.bitcoin: prediction(shortname: \"bitcoin\").thirtyDayPrediction",
            {
                "coinCodex": {
                    "__typename": "CoinCodexQuery",
                    "bitcoin": {
                        "__typename": "CcPrediction",
                        "thirtyDayPrediction": [
                            [
                                1700352000,
                                0.06403204889180654,
                                0
                            ],
                            [
                                1700438400,
                                0.06770721421708131,
                                5.739571650260045
                            ],
                            [
                                1700524800,
                                0.06854332127770023,
                                7.045335053257906
                            ],
                        ]
                    }
                }
            }
        );

        expect(result)
            .toEqual([
                [
                    1700352000,
                    0.06403204889180654,
                    0
                ],
                [
                    1700438400,
                    0.06770721421708131,
                    5.739571650260045
                ],
                [
                    1700524800,
                    0.06854332127770023,
                    7.045335053257906
                ]
            ]);
    });

    it('getDataByPath when array data and path with alias at the end of the path returns array', () => {
        const result = DataAccessor.getDataByPath(
            "coinCodex.bitcoin : prediction(shortname: \"bitcoin\")",
            {
                "coinCodex": {
                    "__typename": "CoinCodexQuery",
                    "bitcoin": [
                        [
                            1700352000,
                            0.06403204889180654,
                            0
                        ],
                        [
                            1700438400,
                            0.06770721421708131,
                            5.739571650260045
                        ],
                        [
                            1700524800,
                            0.06854332127770023,
                            7.045335053257906
                        ],
                    ]
                }
            }
        );

        expect(result)
            .toEqual([
                [
                    1700352000,
                    0.06403204889180654,
                    0
                ],
                [
                    1700438400,
                    0.06770721421708131,
                    5.739571650260045
                ],
                [
                    1700524800,
                    0.06854332127770023,
                    7.045335053257906
                ]
            ]);
    });
});
