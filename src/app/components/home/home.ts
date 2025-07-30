import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { JuegoService } from '../../services/juego';
import { Router } from '@angular/router';
import { ListarPartidasComponent } from '../listar-partidas/listar-partidas';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ListarPartidasComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent {
  user: { id: number; email: string } | null = null;
  maxJugadores: number = 4;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private juegoService: JuegoService,
    private router: Router
  ) {
    this.authService.getUser().subscribe({
      next: (response) => (this.user = response.user),
      error: () => this.router.navigate(['/login']),
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
    });
  }

  crearPartida() {
    this.errorMessage = '';
    if (this.maxJugadores < 4 || this.maxJugadores > 16) {
      this.errorMessage = 'El número de jugadores debe estar entre 4 y 16';
      return;
    }
    this.juegoService.crearPartida(this.maxJugadores).subscribe({
      next: (response) => {
        console.log('Partida creada:', response);
        if (response.juego) {
          this.router.navigate(['/game', response.juego.id]);
        } else {
          this.errorMessage = 'Error: No se recibió información del juego';
        }
      },
      error: (err) => {
        console.error('Error creando la partida:', err);
        this.errorMessage = err.error?.message || 'Error al crear la partida';
      },
    });
  }
}
