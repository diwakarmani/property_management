export interface City {
  id: number;
  name: string;
  stateId: number;
  stateName: string;
  latitude: number;
  longitude: number;
}

export interface Locality {
  id: number;
  name: string;
  cityId: number;
  latitude?: number;
  longitude?: number;
}

export interface LocationSearchRequest {
  cityId: number;
  keyword: string;
}