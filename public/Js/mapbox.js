/* eslint-disable */
import mapboxgl from 'mapbox-gl';

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicGFua2Fqc2V0aGptdCIsImEiOiJjbGw5b2t4NG4xbTJ1M2VvMWp3MHpnb2RyIn0.WkV0elZQzoiJGX35YQ9euQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/pankajsethjmt/cll9pzlhi00pc01ph9pgcckct',
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //add a marker
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
      focusAfterOpen: false,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day} : ${loc.description}</p>`)
      .addTo(map);
    bounds.extend(loc.coordinates);
  });
  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
