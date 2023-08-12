// newConfig = {
//     queries: [
//         {
//             query: 'coinCodex.coinList.data.shortname',
//             index: 'coinIdx'
//         },
//         {
//             query: 'coinCodex.{{buildGraphQLAlias(coinCodex.coinList.data[coinIdx].shortname)}}: prediction(shortname: "{{coinCodex.coinList.data[coinIdx].shortname}}").thirtyDayPrediction',
//             index: 'predictionIdx'
//         },
//     ]
// };

export class GraphQLQueryBuilder {
    // get query data (without deps)
    
    //2
    static buildQuery(readyQueries: string[]): string {
        const queryObj = this.buildQueryObj(readyQueries);
        return this.buildQueryString(queryObj);
    }

    private static buildQueryObj(queries: string[]): any {
        const obj: any = {};

        queries.forEach(query => {
            const queryProps = query.split('.');
            let nestedObj = obj;

            queryProps.forEach(prop => {
                if (!nestedObj[prop]) {
                    nestedObj[prop] = {};
                }   
                nestedObj = nestedObj[prop];
            });
        });
        
        return obj;
    }

    private static buildQueryString(obj: any): string {
        let query = '';
        
        for (const property in obj) {
            query += Object.keys(obj[property]).length === 0 ? `${property},` : `${property} ${this.buildQueryString(obj[property])},`;
        }

        //to remove "," at the end
        return `{ ${query.slice(0, -1)} }`;
    }
}
