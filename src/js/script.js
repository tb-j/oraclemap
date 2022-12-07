// /* eslint-disable no-undef */
function loading() {
  var loader = document.getElementById("loader");

  var processBtn = document.getElementById("processBtn");

  if (loader.classList.contains('hidden')) {
    loader.classList.remove('hidden');
    processBtn.classList.add('hidden')
  } else {
    loader.classList.add('hidden');
    processBtn.classList.remove('hidden');
  }
}
loader.classList.add('hidden')


document.getElementById('downloadBtn').onclick = function () {
  const lc = document.getElementsByClassName('leaflet-control-layers');
  lc[0].style.visibility = 'hidden';
  domtoimage.toPng(document.getElementById('map'), { quality: 1 })
    .then(function (dataUrl) {
      lc[0].style.visibility = 'visible';
      var link = document.createElement('a');
      link.download = 'map.png';
      link.href = dataUrl;
      link.click();
    });
};

document.getElementById('processBtn').onclick = function () {
  loading();
  const lc = document.getElementsByClassName('leaflet-control-layers');
  lc[0].style.visibility = 'hidden';
  domtoimage.toPng(document.getElementById('map'), { quality: 1 })
    .then(function (dataUrl) {
      lc[0].style.visibility = 'visible';
      setPloygon();
      fetch('http://iccc-s019.pl.oracle.com:9001/image', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "imageId": dataUrl,
          "confidence": 0,
          "size": 0
        })
      })
        .then(response => {
          console.log('Server responded with: ' + response);
          setPloygon();
          loading();
        }).catch(() => {
          setPloygon();
          loading();
        });
    });
}

var map = L.map('map', {
  center: [51.56022843116272, 21.864270222449427],
  zoom: 17,
  zoomControl: false,
});


var defaultLayer = L.tileLayer("https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidHpvcmNsIiwiYSI6ImNsYjNzNHNsMzA0OGozb284aG16Y3k2N2QifQ.xiFpfUv-fnNeavBZgF5JvA",
  {
    maxZoom: 25,
    maxNativeZoom: 25
  }).addTo(map);
var baseLayers = {
  'MapBox': defaultLayer,
  'Google': L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    subdomains: ['mt1', 'mt2', 'mt3'],
    maxZoom: 25,
    maxNativeZoom: 25

  }),
  'ArcGIS': L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 17,
    maxNativeZoom: 17
  }),
};
var overlayLayers = {};
var layerControl = L.control.layers(baseLayers, overlayLayers, {
  collapsed: false
}).addTo(map);


const la = document.getElementsByClassName('leaflet-control-attribution');
la[0].style.visibility = 'hidden';

function setPloygon() {
  const res = {
    objects: [
      {
        class: "airplane",
        confidence: 90,
        bounds: {
          "x1": 515,
          "y1": 300,
          "x2": 725,
          "y2": 400
        }
      },
      {
        class: "cat",
        confidence: 90,
        bounds: {
          "x1": 415,
          "y1": 200,
          "x2": 625,
          "y2": 350
        },
      },
      {
        class: "person",
        confidence: 80,
        bounds: {
          "x1": 115,
          "y1": 240,
          "x2": 235,
          "y2": 310
        }
      }
    ]
  }
  res.objects.map(object => {
    const item = object.bounds;
    const points = [
      map.layerPointToLatLng(L.point(item.x1, item.y1)),
      map.layerPointToLatLng(L.point(item.x1, item.y2)),
      map.layerPointToLatLng(L.point(item.x2, item.y2)),
      map.layerPointToLatLng(L.point(item.x2, item.y1)),
      map.layerPointToLatLng(L.point(item.x1, item.y1)),
    ];
    const tooltip = L.tooltip({ permanent: true, sticky: true, opactiy: 0.6 })
      .setLatLng(map.layerPointToLatLng(L.point(item.x2, item.y1)))
      .setContent(`Class: ${object.class}<br/>Confidence: ${object.confidence}`)
      .addTo(map);

      const firstpolyline = new L.Polyline(points, {
      color: 'red',
      weight: 5,
      smoothFactor: 1
    });
    firstpolyline.addTo(map);

  })
}

const lc = document.getElementsByClassName('leaflet-control-layers');
// lc[0].style.visibility = 'hidden';

