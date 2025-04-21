import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, catchError } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class CountryCodesService {
  constructor(private http: HttpClient) {}

  getCountryCodes() {
    return this.http.get<any[]>("https://restcountries.com/v3.1/all").pipe(
      map((countries) =>
        countries.map((country) => ({
          name: country.name.common,
          phoneCode:
            country.idd.root +
            (country.idd.suffixes ? country.idd.suffixes[0] : ""),
        })),
      ),
      catchError((error) => {
        console.error("Error fetching countries", error);
        return [];
      }),
    );
  }
}
