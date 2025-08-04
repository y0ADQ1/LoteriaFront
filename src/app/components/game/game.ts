import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JuegoService, EstadoJuegoResponse } from '../../services/juego';
import { FichaService } from '../../services/ficha';
import { CartaService, CartillaResponse } from '../../services/carta';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.html',
  styleUrl: './game.scss'
})
export class GameComponent implements OnInit, OnDestroy {
  gameState: EstadoJuegoResponse | null = null;
  otherPlayersCartillas: CartillaResponse['cartillas'] = [];
  errorMessage: string = '';
  gameId: number | null = null;
  userId: number | null = null;
  isLoading: boolean = false;
  private pollingInterval: any = null;
  private readonly POLLING_INTERVAL_MS = 3000;
  private readonly MESSAGE_TIMEOUT_MS = 10000; 
  private messageTimeout: any = null;
  private previousTramposos: { id: number; email: string }[] = [];
  private winnerNotified: boolean = false;
  private revanchaPrompted: boolean = false;
  private previousEstado: string | null = null;

  constructor(
    private juegoService: JuegoService,
    private authService: AuthService,
    private fichaService: FichaService,
    private cartaService: CartaService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  private setMessage(message: string) {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
    this.errorMessage = message;
    this.cdr.detectChanges();
    this.messageTimeout = setTimeout(() => {
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, this.MESSAGE_TIMEOUT_MS);
  }

  hasConfirmedRevancha(): boolean {
    const confirmacionesRevancha = this.gameState?.juego.confirmacionesRevancha || [];
    const confirmed = confirmacionesRevancha.some(c => c.id === this.userId);
    console.log('hasConfirmedRevancha:', {
      userId: this.userId,
      confirmacionesRevancha,
      confirmed,
      gameState: this.gameState?.juego.estado,
      esAnfitrion: this.gameState?.usuario.esAnfitrion
    });
    return confirmed;
  }

  getTrampososList(): string {
    return this.gameState?.juego.tramposos?.map(t => t.email).join(', ') || 'Ninguno';
  }

  getConfirmacionesRevanchaList(): string {
    return this.gameState?.juego.confirmacionesRevancha?.map(u => u.email).join(', ') || 'Ninguno';
  }

  getConfirmacionesStatus(): string {
    if (!this.gameState || !this.gameState.usuario.esAnfitrion) return '';
    const confirmaciones = this.gameState.juego.confirmacionesRevancha?.length || 0;
    const needed = Math.max(2, this.gameState.juego.maxJugadores);
    return `${confirmaciones}/${needed} jugadores han confirmado la revancha`;
  }

  getImagenUrl(imagenPath: string): string {
    return this.cartaService.getImagenUrl(imagenPath);
  }

  ngOnInit() {
    this.gameId = Number(this.route.snapshot.paramMap.get('id'));
   
    if (!this.gameId) {
      this.setMessage('ID de juego no válido');
      this.checkActiveGame();
      return;
    }

    this.isLoading = true;
    this.authService.getUser().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (!response.user) {
          this.router.navigate(['/login']);
        } else {
          this.userId = response.user.id;
          console.log('User initialized:', { userId: this.userId });
          localStorage.setItem('currentGameId', this.gameId!.toString());
          this.loadGameState();
        }
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        this.setMessage('Error al obtener información del usuario');
        this.isLoading = false;
        this.router.navigate(['/login']);
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this.stopPolling();
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
  }

  private checkActiveGame() {
    const storedGameId = localStorage.getItem('currentGameId');
    if (storedGameId) {
      this.isLoading = true;
      this.setMessage('Verificando juego activo...');
      this.juegoService.obtenerEstadoJuego().subscribe({
        next: (response) => {
          if (response.juego && response.juego.id === Number(storedGameId) && response.juego.estado !== 'finalizado' && !response.usuario.esTramposo) {
            console.log('Juego activo encontrado, redirigiendo a la partida:', storedGameId);
            this.router.navigate([`/game/${storedGameId}`]);
          } else {
            console.log('No se encontró partida activa o el usuario es un tramposo');
            localStorage.removeItem('currentGameId');
            this.router.navigate(['/home']);
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error checking active game:', err);
          localStorage.removeItem('currentGameId');
          this.setMessage('Error al verificar juego activo');
          this.isLoading = false;
          this.router.navigate(['/home']);
          this.cdr.detectChanges();
        }
      });
    } else {
      this.router.navigate(['/home']);
    }
  }

  private startPolling() {
    if (!this.pollingInterval) {
      console.log('Iniciando polling para estado del juego');
      this.pollingInterval = setInterval(() => {
        this.loadGameState();
      }, this.POLLING_INTERVAL_MS);
    }
  }

  private stopPolling() {
    if (this.pollingInterval) {
      console.log('Deteniendo polling');
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  loadGameState() {
    this.isLoading = true;
    this.juegoService.obtenerEstadoJuego().subscribe({
      next: (response) => {
        console.log('Estado del juego recibido:', {
          estado: response.juego.estado,
          confirmacionesRevancha: response.juego.confirmacionesRevancha,
          cartilla: response.cartilla ? response.cartilla.cartas.map(c => c.id) : null
        });

        if (!response.juego || response.juego.id !== this.gameId || !response.juego.estado) {
          console.warn('Estado inválido recibido o juego no existe, redirigiendo a home:', response.juego);
          this.setMessage('La partida ha sido terminada o no existe');
          this.isLoading = false;
          this.stopPolling();
          localStorage.removeItem('currentGameId');
          this.router.navigate(['/home']);
          this.cdr.detectChanges();
          return;
        }

        if (this.previousEstado === 'revancha_pendiente' && response.juego.estado === 'iniciado') {
          console.log('Game state changed to iniciado, resetting cartilla');
          this.gameState = { ...response, cartilla: null };
          this.revanchaPrompted = false;
        }
        this.previousEstado = response.juego.estado;

        if (response.juego.id !== this.gameId) {
          console.log('Navigating to new game ID:', response.juego.id);
          this.gameId = response.juego.id;
          localStorage.setItem('currentGameId', this.gameId.toString());
          this.router.navigate([`/game/${this.gameId}`], { replaceUrl: true });
          this.revanchaPrompted = false;
        }

        if (
          response.juego.estado === 'finalizado' &&
          response.juego.ganadorId &&
          response.juego.ganadorEmail &&
          !this.winnerNotified
        ) {
          const message = this.userId === response.juego.ganadorId
            ? '¡Felicidades! Has ganado la partida'
            : `¡El jugador ${response.juego.ganadorEmail} ha ganado la partida!`;
          this.setMessage(message);
          this.winnerNotified = true;
          this.revanchaPrompted = false;
          localStorage.removeItem('currentGameId');
          this.stopPolling();
          this.router.navigate(['/home']);
          this.cdr.detectChanges();
          return;
        }

        const currentTramposos = response.juego.tramposos || [];
        const newTramposos = currentTramposos.filter(
          (t) => !this.previousTramposos.some((pt) => pt.id === t.id)
        );
        if (newTramposos.length > 0 && !response.usuario.esTramposo) {
          const message = newTramposos
            .map((t) => `¡El jugador ${t.email} ha sido detectado como tramposo!`)
            .join('\n');
          this.setMessage(message);
        }
        if (response.usuario.esTramposo) {
          console.log('User is tramposo, clearing gameId and redirecting');
          this.setMessage('Has sido expulsado por intentar hacer trampa');
          localStorage.removeItem('currentGameId');
          this.stopPolling();
          this.router.navigate(['/home']);
          this.cdr.detectChanges();
          return;
        }
        this.previousTramposos = [...currentTramposos];

        this.gameState = response;

        if (response.usuario.esAnfitrion && this.userId !== null) {
          this.cartaService.verCartillasJugadores().subscribe({
            next: (cartillaResponse) => {
              this.otherPlayersCartillas = cartillaResponse.cartillas.filter(
                (cartilla) => cartilla.jugador.id !== this.userId
              );
              console.log('Cartillas de otros jugadores:', this.otherPlayersCartillas);
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error al obtener cartillas de otros jugadores:', err);
              this.setMessage(err.error?.message || 'Error al cargar cartillas de otros jugadores');
              this.cdr.detectChanges();
            }
          });
        } else {
          this.otherPlayersCartillas = [];
        }

        localStorage.setItem('currentGameId', response.juego.id.toString());
        this.startPolling();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar estado del juego:', err);
        this.setMessage(err.error?.message || 'La partida ha sido terminada o no existe');
        this.isLoading = false;
        this.stopPolling();
        localStorage.removeItem('currentGameId');
        this.router.navigate(['/home']);
        this.cdr.detectChanges();
      }
    });
  }

  iniciarPartida() {
    if (!this.gameState?.usuario.esAnfitrion) {
      this.setMessage('Solo el anfitrión puede iniciar la partida');
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.juegoService.iniciarPartida().subscribe({
      next: (response) => {
        console.log('Partida iniciada:', response);
        this.isLoading = false;
        this.loadGameState();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al iniciar partida:', err);
        this.setMessage(err.error?.message || 'Error al iniciar la partida');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  iniciarRevancha() {
    if (!this.gameState?.usuario.esAnfitrion) {
      this.setMessage('Solo el anfitrión puede iniciar una revancha');
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.juegoService.iniciarRevancha().subscribe({
      next: (response) => {
        console.log('Propuesta de revancha iniciada:', response);
        this.winnerNotified = false;
        this.revanchaPrompted = false;
        this.isLoading = false;
        this.loadGameState();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al iniciar propuesta de revancha:', err);
        this.setMessage(err.error?.message || 'No se pudo iniciar la revancha. Inténtalo de nuevo.');
        this.isLoading = false;
        setTimeout(() => {
          if (confirm('¿Quieres reintentar iniciar la revancha?')) {
            this.iniciarRevancha();
          }
        }, 2000);
        this.cdr.detectChanges();
      }
    });
  }

  confirmarRevancha(aceptar: boolean) {
    if (this.gameState?.usuario.esAnfitrion) {
      this.setMessage('El anfitrión ya está confirmado');
      this.cdr.detectChanges();
      return;
    }
    if (this.gameState?.juego.estado !== 'revancha_pendiente') {
      this.setMessage('No hay una propuesta de revancha activa');
      this.cdr.detectChanges();
      return;
    }
    console.log('Confirmar revancha llamado manualmente:', { aceptar, userId: this.userId });
    this.isLoading = true;
    this.revanchaPrompted = true;
    this.juegoService.confirmarRevancha(aceptar).subscribe({
      next: (response) => {
        console.log(aceptar ? 'Revancha confirmada' : 'Revancha rechazada', response);
        this.isLoading = false;
        if (!aceptar) {
          this.stopPolling();
          this.router.navigate(['/home']);
        } else {
          this.authService.getUser().subscribe({
            next: (userResponse) => {
              if (this.gameState && this.userId) {
                const userEmail = userResponse.user.email;
                const existingConfirmations = this.gameState.juego.confirmacionesRevancha || [];
                if (!existingConfirmations.some(c => c.id === this.userId)) {
                  this.gameState.juego.confirmacionesRevancha = [
                    ...existingConfirmations,
                    { id: this.userId, email: userEmail }
                  ];
                }
              }
              this.revanchaPrompted = true;
              this.loadGameState();
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Error al obtener email del usuario:', err);
              this.setMessage('Error al obtener información del usuario');
              this.isLoading = false;
              this.revanchaPrompted = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: (err) => {
        console.error('Error al confirmar/rechazar revancha:', {
          status: err.status,
          message: err.error?.message,
          details: err.error
        });
        this.setMessage(err.error?.message || 'Error al confirmar/rechazar revancha');
        this.isLoading = false;
        this.revanchaPrompted = false;
        if (err.status === 401) {
          console.log('Authentication error, refreshing token and retrying...');
          this.authService.refreshToken().subscribe({
            next: () => {
              console.log('Token refreshed, retrying confirmarRevancha');
              this.confirmarRevancha(aceptar);
            },
            error: (refreshErr) => {
              console.error('Failed to refresh token:', refreshErr);
              this.setMessage('Sesión expirada, por favor inicia sesión nuevamente');
              this.router.navigate(['/login']);
              this.cdr.detectChanges();
            }
          });
        } else {
          this.cdr.detectChanges();
        }
      }
    });
  }

  crearRevancha() {
    if (!this.gameState?.usuario.esAnfitrion) {
      this.setMessage('Solo el anfitrión puede crear la revancha');
      this.cdr.detectChanges();
      return;
    }
    if ((this.gameState?.juego.confirmacionesRevancha || []).length < 2) {
      this.setMessage('Se necesitan al menos 2 jugadores confirmados para crear la revancha');
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.juegoService.crearRevancha().subscribe({
      next: (response) => {
        console.log('Revancha creada:', response);
        this.winnerNotified = false;
        this.revanchaPrompted = false;
        this.gameId = response.juego?.id || null;
        this.isLoading = false;
        if (this.gameId) {
          this.router.navigate([`/game/${this.gameId}`]);
          this.stopPolling();
          this.pollingInterval = setInterval(() => {
            this.loadGameState();
          }, this.POLLING_INTERVAL_MS);
          this.loadGameState();
        } else {
          this.setMessage('Error: No se proporcionó ID de juego para la revancha');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al crear revancha:', err);
        this.setMessage(err.error?.message || 'Error al crear la revancha');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  terminarPartida() {
    if (!this.gameState?.usuario.esAnfitrion) {
      this.setMessage('Solo el anfitrión puede terminar la partida');
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.stopPolling();
    this.juegoService.terminarPartida().subscribe({
      next: () => {
        console.log('Partida terminada por el anfitrión');
        this.isLoading = false;
        localStorage.removeItem('currentGameId');
        this.setMessage('Partida terminada exitosamente');
        this.router.navigate(['/home']);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al terminar partida:', err);
        this.setMessage(err.error?.message || 'Error al terminar la partida');
        this.isLoading = false;
        this.startPolling();
        this.cdr.detectChanges();
      }
    });
  }

  revelarCarta() {
    if (!this.gameState?.usuario.esAnfitrion) {
      this.setMessage('Solo el anfitrión puede revelar cartas');
      this.cdr.detectChanges();
      return;
    }
    this.isLoading = true;
    this.cartaService.revelarCarta().subscribe({
      next: (response) => {
        console.log('Carta revelada:', response);
        this.isLoading = false;
        this.loadGameState();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al revelar carta:', err);
        this.setMessage(err.error?.message || 'Error al revelar carta');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  marcarFicha(posicion: number) {
    console.log('Carta actual:', this.gameState?.juego.cartaActual);
    console.log('Carta en posición', posicion, ':', this.gameState?.cartilla?.cartas[posicion]);

    const cartaActual = this.gameState?.juego.cartaActual;
    const cartaEnPosicion = this.gameState?.cartilla?.cartas[posicion];

    if (!cartaActual || !cartaEnPosicion) {
      this.setMessage('No se puede marcar la ficha: información de carta no disponible');
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.fichaService.marcarFicha(posicion).subscribe({
      next: (response) => {
        console.log('Respuesta de marcar ficha:', response);
        this.isLoading = false;
        if (response.expulsado) {
          this.setMessage('Has sido expulsado por intentar hacer trampa');
          this.stopPolling();
          this.router.navigate(['/home']);
        } else if (response.esTramposo) {
          this.setMessage('Has sido marcado como tramposo');
        } else if (response.ganador) {
          this.setMessage('¡Felicidades! Has ganado');
          this.stopPolling();
        } else {
          this.setMessage(response.message);
        }
        this.loadGameState();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al marcar ficha:', err);
        this.setMessage(err.error?.message || 'Error al marcar ficha');
        this.isLoading = false;
        if (err.error?.expulsado) {
          this.setMessage('Has sido expulsado por intentar hacer trampa');
          this.stopPolling();
          this.router.navigate(['/home']);
        }
        this.cdr.detectChanges();
      }
    });
  }

  salirJuego() {
    this.isLoading = true;
    this.juegoService.obtenerEstadoJuego().subscribe({
      next: (response) => {
        if (!response.juego || response.juego.id !== this.gameId || !response.juego.estado) {
          console.log('Usuario no está en un juego o juego no existe, redirigiendo a home');
          this.isLoading = false;
          this.stopPolling();
          localStorage.removeItem('currentGameId');
          this.setMessage('Has salido del juego');
          this.router.navigate(['/home']);
          this.cdr.detectChanges();
          return;
        }

        this.juegoService.salirJuego().subscribe({
          next: () => {
            console.log('Saliendo del juego');
            this.isLoading = false;
            this.stopPolling();
            localStorage.removeItem('currentGameId');
            this.setMessage('Has salido del juego');
            this.router.navigate(['/home']);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error al salir del juego:', err);
            this.setMessage(err.error?.message || 'Error al salir del juego');
            this.isLoading = false;
            this.stopPolling();
            localStorage.removeItem('currentGameId');
            this.router.navigate(['/home']);
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error al verificar estado del juego:', err);
        this.setMessage(err.error?.message || 'La partida no existe o ya ha terminado');
        this.isLoading = false;
        this.stopPolling();
        localStorage.removeItem('currentGameId');
        this.router.navigate(['/home']);
        this.cdr.detectChanges();
      }
    });
  }
}
