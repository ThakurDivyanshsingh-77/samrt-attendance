
import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connectionStatus = new Subject<boolean>();

  connect(): void {
    if (!this.socket || !this.socket.connected) {
      console.log('Connecting to socket server:', environment.socketUrl);
      
      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket?.id);
        this.connectionStatus.next(true);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('⚠️ Socket disconnected:', reason);
        this.connectionStatus.next(false);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  joinSession(sessionId: string): void {
    if (this.socket?.connected) {
      console.log('Joining session:', sessionId);
      this.socket.emit('join-session', sessionId);
    } else {
      console.error('Socket not connected. Cannot join session.');
    }
  }

  leaveSession(sessionId: string): void {
    if (this.socket?.connected) {
      console.log('Leaving session:', sessionId);
      this.socket.emit('leave-session', sessionId);
    }
  }

  onAttendanceMarked(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) {
        console.error('Socket not initialized');
        return;
      }

      this.socket.on('attendance-marked', (data) => {
        console.log('📢 Attendance marked event received:', data);
        observer.next(data);
      });

      return () => {
        this.socket?.off('attendance-marked');
      };
    });
  }

  onSessionExpired(): Observable<void> {
    return new Observable(observer => {
      if (!this.socket) {
        console.error('Socket not initialized');
        return;
      }

      this.socket.on('session-expired', () => {
        console.log('📢 Session expired event received');
        observer.next();
      });

      return () => {
        this.socket?.off('session-expired');
      };
    });
  }
}
