import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), {
      params: this.toHttpParams(params),
      withCredentials: true,
    });
  }

  getRoot<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.rootUrl(path), {
      params: this.toHttpParams(params),
      withCredentials: true,
    });
  }

  post<TResponse, TRequest>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(this.url(path), body, { withCredentials: true });
  }

  postRoot<TResponse, TRequest>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.post<TResponse>(this.rootUrl(path), body, { withCredentials: true });
  }

  patch<TResponse, TRequest>(path: string, body: TRequest): Observable<TResponse> {
    return this.http.patch<TResponse>(this.url(path), body, { withCredentials: true });
  }

  private url(path: string): string {
    return `${environment.apiBaseUrl}/${path.replace(/^\//, '')}`;
  }

  private rootUrl(path: string): string {
    const origin = environment.apiBaseUrl.replace(/\/api\/?$/, '');
    return `${origin}/${path.replace(/^\//, '')}`;
  }

  private toHttpParams(params?: QueryParams): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return httpParams;
  }
}
