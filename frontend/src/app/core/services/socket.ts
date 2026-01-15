import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket!: Socket;
  private connected = false;

  // ===============================
  // CONNECT
  // ===============================
  connect(): void {
    if (this.connected) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
    });
  }

  // ===============================
  // DISCONNECT
  // ===============================
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.connected = false;
    }
  }

  // ===============================
  // JOIN / LEAVE SESSION
  // ===============================
  joinSession(sessionId: string): void {
    if (!this.connected || !sessionId) {
      console.error('❌ joinSession failed: invalid sessionId', sessionId);
      return;
    }
    this.socket.emit('join-session', sessionId);
    console.log('➡️ Joined session:', sessionId);
  }

  leaveSession(sessionId: string): void {
    if (!this.connected || !sessionId) return;
    this.socket.emit('leave-session', sessionId);
    console.log('⬅️ Left session:', sessionId);
  }

  // ===============================
  // LISTENERS
  // ===============================
  onAttendanceMarked(): Observable<any> {
    return new Observable(observer => {
      if (!this.socket) return;

      const handler = (data: any) => {
        observer.next(data);
      };

      this.socket.on('attendance-marked', handler);

      return () => {
        this.socket.off('attendance-marked', handler);
      };
    });
  }

  onSessionExpired(): Observable<void> {
    return new Observable(observer => {
      if (!this.socket) return;

      const handler = () => observer.next();

      this.socket.on('session-expired', handler);

      return () => {
        this.socket.off('session-expired', handler);
      };
    });
  }
}
