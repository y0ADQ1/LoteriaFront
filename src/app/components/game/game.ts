import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JuegoService, EstadoJuegoResponse } from '../../services/juego';
import { FichaService } from '../../services/ficha';
import { CartaService } from '../../services/carta';
import {AuthService} from '../../services/auth';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [],
  templateUrl: './game.html',
  styleUrl: './game.scss'
})
export class GameComponent implements OnInit {
  gameState: EstadoJuegoResponse | null = null;
  errorMessage: string = '';
  gameId: number | null = null;

  constructor(
    private juegoService: JuegoService,
    private authService: AuthService,
    private fichaService: FichaService,
    private  cartaService: CartaService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));

    if (!this.gameId) {
      this.errorMessage = 'ID de juego no valido';
      this.router.navigate(['/home']);
      return;
    }

    this.authService.getUser().subscribe({
      next: (response) => {
        if (!response.user) {
          this.router.navigate(['/login']);
        } else {
          this.loadGameState();
        }
      },
      error: () => this.router.navigate(['/login']),
    })
  }

  loadGameState() {
    this.errorMessage = '';
    this.juegoService.obtenerEstadoJuego().subscribe({
      next: (response) => {
        this.gameState = response;
        if(!response.juego || response.juego.id !== this.gameId) {
          this.errorMessage = 'No estas en este juego';
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al cargar el estado del juego';
        this.router.navigate(['/home']);
      }
    })
  }

  iniciarPartida() {
    if (!this.gameState?.usuario.esAnfitrion) {
      this.errorMessage = 'Solo el anfitrión puede iniciar la partida';
      return;
    }
    this.juegoService.iniciarPartida().subscribe({
      next: (response) => {
        this.loadGameState();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al iniciar la partida';
      }
    });
  }

  revelarCarta() {
    if (!this.gameState?.usuario.esAnfitrion) {
      this.errorMessage = 'Solo el anfitrión puede revelar cartas';
      return;
    }
    this.cartaService.revelarCarta().subscribe({
      next: (response) => {
        this.loadGameState(); // Refresh game state
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al revelar carta';
      },
    });
  }

  marcarFicha(posicion: number) {
    this.fichaService.marcarFicha(posicion).subscribe({
      next: (response) => {
        if (response.esTramposo) {
          this.errorMessage = 'Has sido marcado como tramposo';
        } else if (response.ganador) {
          this.errorMessage = '¡Felicidades! Has ganado';
        } else {
          this.errorMessage = response.message;
        }
        this.loadGameState(); // Refresh game state
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al marcar ficha';
      },
    });
  }

  salirJuego() {
    this.juegoService.salirJuego().subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al salir del juego';
      },
    });
  }
}
