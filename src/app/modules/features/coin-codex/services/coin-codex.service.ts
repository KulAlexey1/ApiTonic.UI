import { Injectable } from "@angular/core";
import { ApiService } from "@app/services";

@Injectable({ providedIn: 'root' })
export class CoinCodexService {
    constructor(private apiService: ApiService) {}

    getCoins() {
        return this.apiService.get("{ coinCodex { coins { name } } }");
    }
}