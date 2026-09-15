import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClaudeService {
  private api = `${environment.baseUrl}/api/ai/chat`;

  constructor(private http: HttpClient) {}

  chat(prompt: string) {
    return this.http.post(this.api, {
      agent: 'claude',
      prompt: prompt
    }, { responseType: 'text' });
  }
}