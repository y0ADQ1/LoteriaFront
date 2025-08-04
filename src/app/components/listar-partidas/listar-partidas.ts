import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
export class ListarPartidasComponent implements OnInit, OnDestroy {
  partidas: { id: number; anfitrionEmail: string; maxJugadores: number; totalJugadores: number; creadoEn: string }[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  errorMessage: string = '';
  private pollingInterval: any = null;
  private readonly POLLING_INTERVAL_MS = 3000; // 3 seconds, matching GameComponent

  constructor(
    private juegoService: JuegoService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.getUser().subscribe({
      next: (response) => {
        if (!response.user) {
          console.log('Usuario no autenticado, redirigiendo a login');
          this.router.navigate(['/login']);
        } else {
          this.loadPartidas(this.currentPage);
          this.startPolling();
        }
      },
      error: (err) => {
        console.error('Error al verificar autenticación:', err);
        this.errorMessage = 'Error al verificar autenticación';
        this.router.navigate(['/login']);
        this.cdr.detectChanges();
      },
    });
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  private startPolling() {
    if (!this.pollingInterval) {
      console.log('Iniciando polling para listar partidas');
      this.pollingInterval = setInterval(() => {
        this.loadPartidas(this.currentPage);
      }, this.POLLING_INTERVAL_MS);
    }
  }

  private stopPolling() {
    if (this.pollingInterval) {
      console.log('Deteniendo polling para listar partidas');
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  loadPartidas(page: number) {
    this.errorMessage = '';
    this.juegoService.listarPartidas(page).subscribe({
      next: (response) => {
        console.log('Partidas cargadas:', {
          page,
          partidas: response.partidas.map(p => ({ id: p.id, totalJugadores: p.totalJugadores })),
          totalPages: response.meta.last_page
        });
        this.partidas = response.partidas;
        this.currentPage = response.meta.current_page;
        this.totalPages = response.meta.last_page;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar partidas:', err);
        this.errorMessage = err.error?.message || 'Error al cargar las partidas';
        this.cdr.detectChanges();
      },
    });
  }

  unirsePartida(juegoId: number) {
    this.errorMessage = '';
    this.juegoService.unirsePartida(juegoId).subscribe({
      next: (response) => {
        console.log('Unido a partida:', response);
        if (response.juego) {
          this.stopPolling(); // Stop polling before navigating
          this.router.navigate(['/game', response.juego.id]);
        } else {
          this.errorMessage = 'Error: No se recibió información del juego';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error al unirse a la partida:', err);
        this.errorMessage = err.error?.message || 'Error al unirse a la partida';
        this.cdr.detectChanges();
      },
    });
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPartidas(page);
    }
  }
}
