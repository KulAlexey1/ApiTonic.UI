import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoinCodexCoinListComponent } from './components';

const routes: Routes = [
    {
        path: 'coins',
        component: CoinCodexCoinListComponent
    },
    {
        path: '**',
        redirectTo: 'coins',
        pathMatch: 'full'
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoinCodexRoutingModule { }
