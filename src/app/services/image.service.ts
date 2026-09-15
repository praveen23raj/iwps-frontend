import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  private api = `${environment.baseUrl}/api/ai/openai/image`;

  constructor(private http: HttpClient) { }

  generateImage(prompt: string) {
    return this.http.post<any>(this.api, {
      prompt: prompt
    });
  }
}