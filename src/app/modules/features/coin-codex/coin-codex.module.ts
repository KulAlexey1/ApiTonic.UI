import { NgModule } from "@angular/core";
import { CoinCodexCoinListComponent } from "./components";
import { CoinCodexRoutingModule } from "./coin-codex-routing.module";
import { CommonModule } from "@angular/common";

@NgModule({
    imports: [
        CoinCodexRoutingModule,
        CommonModule
    ],
    declarations: [
        CoinCodexCoinListComponent
    ]
})
export class CoinCodexModule {}