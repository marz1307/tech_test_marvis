import { Component, inject } from "@angular/core";
import { AppService } from "./app.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [],
  template: `<h1>{{appData}}</h1>`,
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "home";

  appDataService: AppService = inject(AppService);
  appData: string = "";

  constructor() {
    this.appDataService.getAppData().then((data) => {
      this.appData = data;
    });
  }
}
