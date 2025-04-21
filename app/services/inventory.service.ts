import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Article } from "../interfaces/article.interface";

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  private backendUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  getItems(page: number, pageSize: number, filters?: any) {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("pageSize", pageSize.toString());

    if (filters) {
      Object.keys(filters).forEach((key) => {
        params = params.set(key, filters[key]);
      });
    }

    return this.http.post<{ data: Article[]; total: number }>(
      `${this.backendUrl}/article/all`,
      filters,
      { params },
    );
  }

  getItemsByType(page: number, pageSize: number, type: string, filters?: any) {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("pageSize", pageSize.toString());

    return this.http.post<{ data: Article[]; total: number }>(
      `${this.backendUrl}/article/type/${type}`,
      filters,
      { params },
    );
  }

  getItemsWithIdArray(itemIds: string[]) {
    return this.http.post(`${this.backendUrl}/article/ids`, itemIds);
  }

  getGroups() {
    return this.http.get<any[]>(`${this.backendUrl}/article/lenses/group/all`);
  }

  searchItems(page: number, pageSize: number, query: string, filters?: any) {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("pageSize", pageSize.toString())
      .set("query", query);

    if (filters) {
      Object.keys(filters).forEach((key) => {
        params = params.set(key, filters[key]);
      });
    }

    return this.http.post<{ data: Article[]; total: number }>(
      `${this.backendUrl}/article/search`,
      filters,
      { params },
    );
  }

  removeItem(id: string) {
    return this.http.delete(`${this.backendUrl}/article/id/${id}`);
  }

  removeMultipleItems(itemsIds: string[]) {
    return this.http.post(`${this.backendUrl}/article/selected`, itemsIds);
  }

  updateItem(itemId: string, updatedData: any) {
    return this.http.put(
      `${this.backendUrl}/article/id/${itemId}`,
      updatedData,
    );
  }

  bulkPriceChange(query: string, newPrice: number) {
    const requestBody = {
      query,
      newPrice,
    };

    return this.http.patch(
      `${this.backendUrl}/articles/bulk-price-change`,
      requestBody,
    );
  }

  createItem(newItem: any, type: string) {
    return this.http.post(`${this.backendUrl}/article/${type}/new`, newItem);
  }

  createGroup(newGroup: any) {
    return this.http.post(
      `${this.backendUrl}/article/lenses/group/new`,
      newGroup,
    );
  }

  addLensToGroup(groupId: string, lensId: string) {
    return this.http.post(
      `${this.backendUrl}/article/group/${groupId}/${lensId}`,
      {},
    );
  }

  updateArticle(articleId: string, updatedArticle: any) {
    return this.http.put(
      `${this.backendUrl}/article/id/${articleId}`,
      updatedArticle,
    );
  }
}
