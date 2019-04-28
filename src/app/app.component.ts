import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { DataService } from './data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('container') container: ElementRef;

  public map;
  public data;

  constructor(private dataSerive: DataService) {}

  reset() {
    this.map.flyTo({ center: [0, 51.5], zoom: 8 });
  }

  initMap(data) {
    mapboxgl.accessToken =
      'pk.eyJ1IjoicHNhbnRvc2giLCJhIjoiY2p1eG1kYm5mMDdrYTQ0bzRrZTlwaGdneSJ9.0dbSNT9e-olStlkUmN9HRg';
    this.map = new mapboxgl.Map({
      container: this.container.nativeElement,
      style: 'mapbox://styles/mapbox/light-v10',
      zoom: 8,
      center: [0, 51.5]
    });
    this.map.on('load', () => {
      this.map.addSource('locations', {
        type: 'geojson',
        data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      this.map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'locations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            100,
            '#f1f075',
            750,
            '#f28cb1'
          ],
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
        }
      });

      this.map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'locations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        }
      });

      this.map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'locations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 8,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // Show a popup when clicking on a point.
      this.map.on('click', 'clusters', e => {
        var features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        var clusterId = features[0].properties.cluster_id;
        this.map.getSource('locations').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;

          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        });
      });

      this.map.on('click', 'unclustered-point', event => {
        let html = `
        <div>
        <div>Properties</div>
          <table>`;
        let properties = event.features[0].properties;
        for (const key in properties) {
          if (properties.hasOwnProperty(key)) {
            const element = properties[key];
            html += `
              <tr><td>${key}</td><td>${element}</td></tr>
            `;
          }
        }
        html += `
              <tr><td>Latitude</td><td>${event.lngLat.lat}</td></tr>
            `;
        html += `
              <tr><td>Longitude</td><td>${event.lngLat.lng}</td></tr>
            `;
        html += `</table>          
        </div>
        `;
        new mapboxgl.Popup()
          .setLngLat(event.lngLat)
          .setHTML(html)
          .addTo(this.map);
      });

      // Change the cursor to a pointer when the mouse is over the points layer.
      this.map.on('mouseenter', 'clusters', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      this.map.on('mouseleave', 'clusters', () => {
        this.map.getCanvas().style.cursor = '';
      });

      // Change the cursor to a pointer when the mouse is over the points layer.
      this.map.on('mouseenter', 'unclustered-point', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      this.map.on('mouseleave', 'unclustered-point', () => {
        this.map.getCanvas().style.cursor = '';
      });
    });
  }

  ngOnInit(): void {
    this.dataSerive.getData('./assets/data.json').subscribe(data => {
      this.data = data;
      this.initMap(data);
    });
  }
}
