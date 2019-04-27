import { Component } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'map-box-cluster';

  constructor(private http: HttpClient) {
    this.http.get('./assets/data.json').subscribe(data => {
      // Create mapbox-gl instance.
      const map = new mapboxgl.Map({
        container: document.getElementById('container'),
        style: {
          version: 8,
          zoom: 8, // default zoom.
          center: [0, 51.5], // default center coordinate in [longitude, latitude] format.
          sources: {
            // Using an open-source map tile layer.
            'simple-tiles': {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'simple-tiles',
              type: 'raster',
              source: 'simple-tiles',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        }
      });
      map.on('load', () => {
        // Add points to map as a GeoJSON source.
        map.addSource('points', {
          type: 'geojson',
          data
        });

        // Add a layer to the map to render the GeoJSON points.
        map.addLayer({
          id: 'points',
          type: 'circle',
          source: 'points',
          paint: {
            'circle-radius': 5,
            'circle-color': '#ff5500',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000'
          }
        });

        // Show a popup when clicking on a point.
        map.on('click', 'points', event => {
          console.log(event);
          new mapboxgl.Popup()
            .setLngLat(event.lngLat)
            .setHTML('Clicked on ' + event.features.length + ' feature(s).')
            .addTo(map);
        });

        // Change the cursor to a pointer when the mouse is over the points layer.
        map.on('mouseenter', 'points', () => {
          map.getCanvas().style.cursor = 'pointer';
        });

        // Change it back to a pointer when it leaves.
        map.on('mouseleave', 'points', () => {
          map.getCanvas().style.cursor = '';
        });
      });
    });
  }
}
