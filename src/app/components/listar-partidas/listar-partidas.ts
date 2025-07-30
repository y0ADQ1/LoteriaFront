import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuegoService, ListarPartidasResponse } from '../../services/juego';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-listar-partidas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './listar-partidas.html',
  styleUrls: ['./listar-partidas.scss'],
})
export class ListarPartidasComponent implements OnInit {
  partidas: { id: number; anfitrionEmail: string; maxJugadores: number; totalJugadores: number; creadoEn: string }[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  errorMessage: string = '';

  constructor(
    private juegoService: JuegoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.getUser().subscribe({
      next: (response) => {
        if (!response.user) {
          this.router.navigate(['/login']);
        } else {
          this.loadPartidas(this.currentPage);
        }
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  loadPartidas(page: number) {
    this.errorMessage = '';
    this.juegoService.listarPartidas(page).subscribe({
      next: (response) => {
        this.partidas = response.partidas;
        this.currentPage = response.meta.current_page;
        this.totalPages = response.meta.last_page;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al cargar las partidas';
      },
    });
  }

  unirsePartida(juegoId: number) {
    this.errorMessage = '';
    this.juegoService.unirsePartida(juegoId).subscribe({
      next: (response) => {
        console.log('Unido a partida:', response);
        if (response.juego) {
          this.router.navigate(['/game', response.juego.id]);
        } else {
          this.errorMessage = 'Error: No se recibió información del juego';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al unirse a la partida';
      },
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadPartidas(page);
    }
  }
}
