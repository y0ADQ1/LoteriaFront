import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { HomeComponent } from './components/home/home';
import { GameComponent } from './components/game/game';
import { inject } from '@angular/core';
import { AuthService } from './services/auth';
import { Router } from '@angular/router';
import { JuegoService } from './services/juego';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const router = inject(Router);
        const juegoService = inject(JuegoService);

        if (!authService.isAuthenticated()) {
          console.log('Usuario no autenticado, redirigiendo a login');
          router.navigate(['/login']);
          return false;
        }

        const storedGameId = localStorage.getItem('currentGameId');
        if (storedGameId) {
          return juegoService.obtenerEstadoJuego().toPromise().then(
            (response) => {
              if (
                response?.juego &&
                response.juego.id === Number(storedGameId) &&
                response.juego.estado !== 'finalizado' &&
                !response.usuario.esTramposo
              ) {
                console.log('Juego activo encontrado, redirigiendo a la partida:', storedGameId);
                router.navigate([`/game/${storedGameId}`]);
                return false;
              }
              console.log('No se encontró partida activa o el usuario es tramposo, permitiendo acceso a home');
              localStorage.removeItem('currentGameId');
              return true;
            },
            (err) => {
              console.error('Error al verificar partida activa:', err);
              localStorage.removeItem('currentGameId');
              return true;
            }
          );
        }
        console.log('No hay partida activa en localStorage, permitiendo acceso a home');
        return true;
      },
    ],
  },
  {
    path: 'game/:id',
    component: GameComponent,
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const router = inject(Router);
        if (authService.isAuthenticated()) {
          return true;
        } else {
          console.log('Usuario no autenticado, redirigiendo a login');
          router.navigate(['/login']);
          return false;
        }
      },
    ],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];