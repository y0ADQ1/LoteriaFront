import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomeComponent {
  user: { id: number; email: string } | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.authService.getUser().subscribe({
      next: (response) => (this.user = response.user),
      error: () => this.router.navigate(['/login']),
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
    });
  }
}
