import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface Juego {
  id: number;
  estado: 'esperando' | 'iniciado' | 'finalizado' | 'revancha_pendiente';
  esAnfitrion?: boolean;
  totalJugadores: number;
  maxJugadores: number;
  cartaActual?: MazoCarta | null;
  totalCartasAnunciadas?: number;
  ganadorId?: number | null;
  ganadorEmail?: string | null;
  cartasAnunciadas?: number[];
  tramposos: { id: number; email: string }[];
  confirmacionesRevancha?: { id: number; email: string }[];
}

interface MazoCarta {
  id: number;
  numero: number;
  nombre: string;
  imagen: string;
}

interface JuegoResponse {
  message: string;
  juego?: Juego;
}

export interface EstadoJuegoResponse {
  message: string;
  juego: Juego;
  usuario: {
    esAnfitrion: boolean;
    esTramposo: boolean;
  };
  cartilla: {
    cartas: MazoCarta[];
    fichas: boolean[];
  } | null;
}

interface PartidaListada {
  id: number;
  anfitrionEmail: string;
  maxJugadores: number;
  totalJugadores: number;
  creadoEn: string;
}

export interface ListarPartidasResponse {
  message: string;
  partidas: PartidaListada[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    first_page: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    previous_page_url: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class JuegoService {
  private apiUrl = 'http://localhost:3333/juego';

  constructor(private http: HttpClient) {}

  crearPartida(maxJugadores: number): Observable<JuegoResponse> {
    console.log('Creando partida con maxJugadores:', maxJugadores);
    return this.http.post<JuegoResponse>(`${this.apiUrl}/crear`, { maxJugadores });
  }

  unirsePartida(juegoId: number): Observable<JuegoResponse> {
    console.log('Joining game with ID:', juegoId);
    return this.http.post<JuegoResponse>(`${this.apiUrl}/unirse`, { juegoId });
  }

  listarPartidas(page: number = 1): Observable<ListarPartidasResponse> {
    console.log('Fetching available games, page:', page);
    return this.http.get<ListarPartidasResponse>(`${this.apiUrl}/listar?page=${page}`);
  }

  iniciarPartida(): Observable<JuegoResponse> {
    console.log('Starting game');
    return this.http.post<JuegoResponse>(`${this.apiUrl}/iniciar`, {});
  }

  obtenerEstadoJuego(): Observable<EstadoJuegoResponse> {
    console.log('Fetching game state');
    return this.http.get<EstadoJuegoResponse>(`${this.apiUrl}/estado`);
  }

  salirJuego(): Observable<{ message: string }> {
    console.log('Exiting game');
    return this.http.post<{ message: string }>(`${this.apiUrl}/salir`, {});
  }

  iniciarRevancha(): Observable<JuegoResponse> {
    console.log('Iniciando propuesta de revancha');
    return this.http.post<JuegoResponse>(`${this.apiUrl}/revancha`, {});
  }

  confirmarRevancha(aceptar: boolean): Observable<JuegoResponse> {
    console.log('Sending confirmarRevancha request:', { aceptar, url: `${this.apiUrl}/confirmar-revancha` });
    return this.http.post<JuegoResponse>(`${this.apiUrl}/confirmar-revancha`, { aceptar })
      .pipe(
        tap((response) => {
          console.log('confirmarRevancha response:', response);
        })
      );
  }

  crearRevancha(): Observable<JuegoResponse> {
    console.log('Creando revancha');
    return this.http.post<JuegoResponse>(`${this.apiUrl}/crear-revancha`, {});
  }

  terminarPartida(): Observable<{ message: string }> {
    console.log('Terminando partida');
    return this.http.post<{ message: string }>(`${this.apiUrl}/terminar`, {});
  }
}