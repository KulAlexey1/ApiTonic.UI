import { IndexGroup, IndexStructure, IndexValue } from '../../models';

export class IndexStructureService {
    // index structure, indexes: [ 'coinIdx' ]
    // index group
    // { coinIdx: 1 }
    // index group
    // { coinIdx: 2 }

    // index structure, indexes: [ 'coinIdx', 'predictionIdx' ]
    // index group
    // { coinIdx: 1 }, { predictionIdx: 1 }
    // index group
    // { coinIdx: 1 }, { predictionIdx: 2 }
    static buildIndexStructure(index: string, arrayData: unknown[], usedIndexes: string[], prevIndexStructure: IndexStructure[]): IndexStructure {
        let groups: IndexGroup[] = [];
        
        if (usedIndexes.length) {
            const usedIndexStructure = prevIndexStructure.find(x =>
                x.indexes.length === usedIndexes.length && x.indexes.every(idx => usedIndexes.includes(idx)));
            if (!usedIndexStructure) {
                throw new Error(`No appropriate index structure was found for indexes: ${usedIndexes.toString()}`);
            }

            groups = usedIndexStructure.groups.flatMap(g =>
                arrayData.map((d, idx) =>
                    ([...g, { index, value: idx } as IndexValue ]) as IndexGroup ));
        } else {
            groups = arrayData.map((d, idx) =>
                ([ { index, value: idx } as IndexValue ] as IndexGroup ));
        }

        return { indexes: [ index, ...usedIndexes ], groups };
    }

}
