import { Routes } from '@angular/router';
import { anonGuard } from './guards/anon-guard';
import { authGuard } from './guards/auth.guard';
import { LandingPageComponent } from './pages/landing-page/landing-page.component';
import { productListResolver } from './pages/storefront/product-list-resolver';

export const routes: Routes = [
    { path: '', data: { preload: true }, resolve: { productList: productListResolver },component: LandingPageComponent},
    {
        path: '',
        canActivate: [anonGuard],
        loadComponent: () => import('./pages/auth/auth-layout.component').then(m => m.AuthLayoutComponent),
        children: [
            { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
            { path: 'signup', loadComponent: () => import('./pages/auth/sgnup/signup.component').then(m => m.SignupComponent) },
            { path: 'forget', loadComponent: () => import('./pages/auth/forget-pwd/forget-pwd.component').then(m => m.ForgetPwdComponent) }
        ]
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
        canActivate: [authGuard],
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/dashboard/user-dashboard/user-dashboard').then(m => m.UserDashboardComponent),
                children: [
                    { path: '', loadComponent: () => import('./pages/dashboard/overview/overview.component').then(m => m.OverviewComponent), pathMatch: 'full' },
                    { path: 'profile', loadComponent: () => import('./pages/dashboard/profile/profile.component').then(m => m.ProfileComponent) },
                    { path: 'addresses', loadComponent: () => import('./shared/pages/my-address-component/my-address-component').then(m => m.MyAddressesComponent) },
                    { path: 'orders', loadComponent: () => import('./pages/dashboard/my-orders/myorders.component').then(m => m.MyordersComponent) },
                    { path: 'settings', loadComponent: () => import('./pages/dashboard/setting/setting.component').then(m => m.SettingComponent) },
                    // { path: 'home', loadComponent: () => import('./pages/landing-page/landing-page.component').then(m => m.LandingPageComponent) },
                    { path: 'active-plan', loadComponent: () => import('./pages/dashboard/active-plan/myactiveplan.component').then(m => m.MyAcivePlanComponent) },

                ]
            }
        ]
    },

    {
        path: 'checkout',
        loadComponent: () => import('./pages/checkout/checkout-layout/checkout-layout.componeent').then(m => m.CheckoutLayoutComponent),
        children: [
            { path: '', loadComponent: () => import('./pages/checkout/checkout-new/checkout-new.component').then((m) => m.CheckoutNewComponent) },
        ]
    },

    { path: '404', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotfoundComponent) },
    { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotfoundComponent) }

];
