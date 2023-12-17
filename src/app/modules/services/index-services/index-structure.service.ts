import { IndexStructure, IndexValues } from '@app/models';

export class IndexStructureService {
    public static build(index: string, arrayData: unknown[]): IndexStructure {
        return [ this.buildValues(index, arrayData) ];
    }

    public static append(current: IndexStructure, updates: IndexStructure): IndexStructure {
        const result: IndexStructure = [ ...current.map(x => ({...x})) ];

        return updates.reduce(
            (res, x) => this.addOrUpdateIndex(res, x),
            result
        );
    }

    private static addOrUpdateIndex(indexStructure: IndexStructure, newValues: IndexValues): IndexStructure {
        let currentValues = indexStructure.find(x => x.index === newValues.index);
        
        if (currentValues) {
            currentValues = {
                ...currentValues,
                values: [ ...currentValues.values, ...newValues.values ]
            };
        } else {
            currentValues = { ...newValues };
        }

        return [
            ...indexStructure.filter(x => x.index !== newValues.index),
            currentValues
        ];
    }

    private static buildValues(index: string, arrayData: unknown[]): IndexValues {
        return {
            index,
            values: [ arrayData.map((_, idx) => idx) ]
        };
    }
}
