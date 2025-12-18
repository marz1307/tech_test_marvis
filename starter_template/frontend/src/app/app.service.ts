import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class AppService {
  url = "http://127.0.0.1:8000/";

  async getAppData(): Promise<string> {
    const response = await fetch(this.url);
    const data = await response.json();
    return data.message
  }

  submitAppData(data: string) {
    console.log(data);
  }
}
