import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

interface AuthResponse {
  message: string;
  user: { id: number; email: string };
  token?: { type: string; value: string };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3333';
  private token: string | null = null;

  constructor(private http: HttpClient) { }

  refreshToken(): Observable<any> {
    console.log('Attempting to refresh token');
    const currentToken = this.getToken();
    if (!currentToken) {
      console.error('No token available for refresh');
      return throwError(() => new Error('No token available'));
    }
    return this.http.post(`${this.apiUrl}/auth/refresh`, {})
      .pipe(
        tap((response: any) => {
          if (response.token?.value) {
            console.log('Token refreshed successfully');
            this.setToken(response.token.value);
          } else {
            console.error('No token in refresh response');
          }
        }),
        catchError((err) => {
          console.error('Token refresh failed:', err);
          return throwError(() => err);
        })
      );
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, { email, password })
      .pipe(tap((response) => this.setToken(response.token!.value)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(tap((response) => this.setToken(response.token!.value)));
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.token = null;
        localStorage.removeItem('token');
      })
    );
  }

  getUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/me`);
  }

  getUserById(userId: number): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/auth/user/${userId}`);
  }

  setToken(token: string): void {
    console.log('Setting token:', token.substring(0, 10) + '...');
    this.token = token;
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
      console.log('Retrieved token from localStorage:', this.token ? this.token.substring(0, 10) + '...' : null);
    }
    return this.token;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    console.log('Checking authentication, token:', token ? token.substring(0, 10) + '...' : null);
    return !!token;
  }
}
