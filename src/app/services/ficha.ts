import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface MarcarFichaResponse {
  expulsado: any;
  message: string;
  totalFichas: number;
  cartillaCompleta: boolean;
  esTramposo?: boolean;
  ganador?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FichaService {
  private apiUrl = 'http://localhost:3333/juego';

  constructor(private http: HttpClient) { }

  marcarFicha(posicion: number): Observable<MarcarFichaResponse> {
    console.log('Marcando ficha en la posición:', posicion);
    return this.http.post<MarcarFichaResponse>(`${this.apiUrl}/marcar-ficha`, { posicion });
  }
}
