import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface MazoCarta {
  id: number;
  numero: number;
  nombre: string;
  imagen: string;
}

interface MazoCartaResponse {
  message: string
  cartas: MazoCarta[];
}

@Injectable({
  providedIn: 'root'
})
export class MazoCartaService {
  private apiUrl: string = 'http://localhost:3000/juego';

  constructor(private http: HttpClient) { }

  getAllCartas(): Observable<MazoCartaResponse> {
    console.log('Obteniendo todas las cartas del mazo');
    return this.http.get<MazoCartaResponse>(`${this.apiUrl}/mazo-cartas`);
  }
}
