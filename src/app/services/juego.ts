import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Juego {
  id: number;
  estado: 'esperando' | 'iniciado' | 'finalizado';
  esAnfitrion?: boolean;
  totalJugadores?: number;
  cartaActual?: MazoCarta | null;
  totalCartasAnunciadas?: number;
  ganadorId?: number | null;
  cartasAnunciadas?: number[];
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

interface EstadoJuegoResponse {
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

@Injectable({
  providedIn: 'root',
})
export class JuegoService {
  private apiUrl = 'http://localhost:3333/juego';

  constructor(private http: HttpClient) {}

  crearPartida(): Observable<JuegoResponse> {
    console.log('Creating new game');
    return this.http.post<JuegoResponse>(`${this.apiUrl}/crear`, {});
  }

  unirsePartida(codigoJuego: number): Observable<JuegoResponse> {
    console.log('Joining game with code:', codigoJuego);
    return this.http.post<JuegoResponse>(`${this.apiUrl}/unirse`, { codigoJuego });
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
}
