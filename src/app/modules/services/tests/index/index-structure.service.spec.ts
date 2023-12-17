import { IndexStructure } from "app/modules/models";
import { IndexStructureService } from "@app/services";

describe('IndexStructureService', () => {
    it('build when index with array data returns structure for it', () => {
        const result = IndexStructureService.build('shortNameIdx', ['BTC', 'ETH']);

        expect(result)
            .toEqual([
                {
                    index: 'shortNameIdx',
                    values: [ [ 0, 1 ] ]
                }
            ] as IndexStructure);
    });

    it('build when index and no array data returns structure with values containing empty element', () => {
        const result = IndexStructureService.build('shortNameIdx', []);

        expect(result)
            .toEqual([
                {
                    index: 'shortNameIdx',
                    values: [ [] ]
                }
            ] as IndexStructure);
    });

    it('append when current is empty and there are updates returns updates', () => {
        const updates: IndexStructure = [
            {
                index: 'shortNameIdx',
                values: [ [ 0, 1 ] ]
            }
        ];
        const result = IndexStructureService.append([], updates);

        expect(result).toEqual(updates);
    });

    it('append when current contains empty element and there are updates returns index structure with empty element and updates', () => {
        const current: IndexStructure = [
            {
                index: 'shortNameIdx',
                values: [ [] ]
            }
        ];
        const updates: IndexStructure = [
            {
                index: 'shortNameIdx',
                values: [ [ 0, 1 ] ]
            }
        ];
        const result = IndexStructureService.append(current, updates);

        expect(result)
            .toEqual([
                {
                    index: 'shortNameIdx',
                    values: [
                        [ ],
                        [ 0, 1 ]
                    ]
                }
            ] as IndexStructure);
    });

    it('append when there are current and updates for the same indexes returns one index structure with all values', () => {
        const current: IndexStructure = [
            {
                index: 'shortNameIdx',
                values: [ 
                    [ 0, 1 ],
                    [ 0, 1, 2]
                ]
            }
        ];
        const updates: IndexStructure = [
            {
                index: 'shortNameIdx',
                values: [
                    [ 0, 1, 2, 3 ],
                    [ 0, 1, 2, 3, 4 ]
                ]
            }
        ];
        const result = IndexStructureService.append(current, updates);

        expect(result)
            .toEqual([
                {
                    index: 'shortNameIdx',
                    values: [
                        [ 0, 1 ],
                        [ 0, 1, 2],
                        [ 0, 1, 2, 3 ],
                        [ 0, 1, 2, 3, 4 ]
                    ]
                }
            ] as IndexStructure);
    });

    it('append when there are current and updates for different indexes returns one index structure with all values', () => {
        const current: IndexStructure = [
            {
                index: 'shortNameIdx',
                values: [ 
                    [ 0, 1 ],
                    [ 0, 1, 2]
                ]
            }
        ];
        const updates: IndexStructure = [
            {
                index: 'predictionIdx',
                values: [
                    [ 0, 1, 2, 3 ],
                    [ 0, 1, 2, 3, 4 ]
                ]
            }
        ];
        const result = IndexStructureService.append(current, updates);

        expect(result)
            .toEqual([
                {
                    index: 'shortNameIdx',
                    values: [
                        [ 0, 1 ],
                        [ 0, 1, 2]
                    ]
                },
                {
                    index: 'predictionIdx',
                    values: [
                        [ 0, 1, 2, 3 ],
                        [ 0, 1, 2, 3, 4 ]
                    ]
                }
            ] as IndexStructure);
    });
});
