import { IndexGroup, IndexStructure } from "app/modules/models";
import { IndexStructureService } from "@app/services";

describe('IndexStructureService', () => {
    it('buildIndexStructure when single index returns structure for it', () => {
        const result = IndexStructureService.buildIndexStructure('shortNameIdx',
            ['BTC', 'ETH'], [], []);

        expect(result)
            .toEqual({
                indexes: [ 'shortNameIdx' ],
                groups: [
                    [ { index: 'shortNameIdx', value: 0 } ] as IndexGroup,
                    [ { index: 'shortNameIdx', value: 1 } ] as IndexGroup
                ]
            } as IndexStructure);
    });

    it('buildIndexStructure when multiple indexes returns structure for it', () => {
        const result = IndexStructureService.buildIndexStructure(
            'predictionIdx',
            [ { prediction: 123 }, { prediction: 456 }, { prediction: 789 } ],
            [ 'shortNameIdx' ],
            [{
                indexes: [ 'shortNameIdx' ],
                groups: [
                    [ { index: 'shortNameIdx', value: 0 } ] as IndexGroup,
                    [ { index: 'shortNameIdx', value: 1 } ] as IndexGroup
                ]
            }]
        );

        expect(result)
            .toEqual({
                indexes: [ 'predictionIdx', 'shortNameIdx' ],
                groups: [
                    [ { index: 'shortNameIdx', value: 0 }, { index: 'predictionIdx', value: 0 } ] as IndexGroup,
                    [ { index: 'shortNameIdx', value: 0 }, { index: 'predictionIdx', value: 1 } ] as IndexGroup,
                    [ { index: 'shortNameIdx', value: 0 }, { index: 'predictionIdx', value: 2 } ] as IndexGroup,
                    [ { index: 'shortNameIdx', value: 1 }, { index: 'predictionIdx', value: 0 } ] as IndexGroup,
                    [ { index: 'shortNameIdx', value: 1 }, { index: 'predictionIdx', value: 1 } ] as IndexGroup,
                    [ { index: 'shortNameIdx', value: 1 }, { index: 'predictionIdx', value: 2 } ] as IndexGroup,
                ]
            } as IndexStructure);
    });
});
