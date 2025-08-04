import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface MazoCarta {
  id: number;
  numero: number;
  nombre: string;
  imagen: string;
}

interface RevelarCartaResponse {
  message: string;
  carta: MazoCarta;
  totalCartasReveladas: number;
  totalCartas: number;
}

interface Cartilla {
  cartas: MazoCarta[];
  fichas: boolean[];
}

export interface CartillaResponse {
  message: string;
  cartillas: {
    jugador: {
      id: number;
      email: string;
      esTramposo: boolean;
    };
    cartilla: Cartilla | null;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class CartaService {
  private apiUrl = 'http://localhost:3333/juego';
  private baseUrl = 'http://localhost:3333';

  constructor(private http: HttpClient) { }

  getImagenUrl(imagenPath: string): string {
    return `${this.baseUrl}${imagenPath}`;
  }

  revelarCarta(): Observable<RevelarCartaResponse> {
    console.log('Revelando la siguiente carta');
    return this.http.post<RevelarCartaResponse>(`${this.apiUrl}/revelar-carta`, {});
  }

  verCartillasJugadores(): Observable<CartillaResponse> {
    console.log('Obteniendo jugadores\' cartillas');
    return this.http.get<CartillaResponse>(`${this.apiUrl}/cartillas`);
  }
}
