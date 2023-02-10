const SERVER_URL = 'https://iccc-s019.pl.oracle.com:9001';
const polylines = [];
const tooltips = [];
const data = {};

const la = document.getElementsByClassName('leaflet-control-attribution');
const lc = document.getElementsByClassName('leaflet-control-layers');
const loader = document.getElementById('loader');

const map = L.map('map', {
  center: [51.56032873116272, 21.864270222449427],
  zoom: 18,
  zoomControl: true,
});

const defaultLayer =
  L.tileLayer("https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    subdomains: ['mt1', 'mt2', 'mt3'],
    maxZoom: 25,
    maxNativeZoom: 25
  }).addTo(map);

const overlayLayers = {};
const baseLayers = {
  'Google Maps': defaultLayer,
  'MapBox': L.tileLayer("https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidHpvcmNsIiwiYSI6ImNsYjNzNHNsMzA0OGozb284aG16Y3k2N2QifQ.xiFpfUv-fnNeavBZgF5JvA",
    {
      maxZoom: 25,
      maxNativeZoom: 25
    }),
  'ArcGIS': L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 17,
    maxNativeZoom: 17
  }),
};

const layerControl = L.control.layers(baseLayers, overlayLayers, {
  collapsed: false
}).addTo(map);

la[0].style.visibility = 'hidden';
loader.classList.add('hidden');

function setDiffPloygon(res) {
  res.objects.map(item => {
    const points = [
      map.layerPointToLatLng(L.point(item.bounds.x, item.bounds.y)),
      map.layerPointToLatLng(L.point(item.bounds.x + item.bounds.w, item.bounds.y)),
      map.layerPointToLatLng(L.point(item.bounds.x + item.bounds.w, item.bounds.y + item.bounds.h)),
      map.layerPointToLatLng(L.point(item.bounds.x, item.bounds.y + item.bounds.h)),
      map.layerPointToLatLng(L.point(item.bounds.x, item.bounds.y)),
    ];
    const firstpolyline = new L.Polyline(points, {
      color: 'red',
      weight: 5,
      smoothFactor: 1
    });
    firstpolyline.addTo(map);
    polylines.push(firstpolyline);
  })
}

function setObjectDetectionPloygon(res) {
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
      .setContent(`Class: ${object.class}<br/>Confidence: ${Number(object.confidence * 100).toFixed(2)}%`)
      .addTo(map);

    tooltips.push(tooltip);

    const firstpolyline = new L.Polyline(points, {
      color: 'red',
      weight: 5,
      smoothFactor: 1
    });
    firstpolyline.addTo(map);
    polylines.push(firstpolyline);
  })
}

function resetMap() {
  polylines.forEach(pl => {
    map.removeLayer(pl)
  })
  tooltips.forEach(tl => {
    map.removeLayer(tl)
  })
}

function processLoaderIcon(buttonId) {
  const processBtn = document.getElementById(buttonId);
  if (loader.classList.contains('hidden')) {
    loader.classList.remove('hidden');
    processBtn.classList.add('hidden')
  } else {
    loader.classList.add('hidden');
    processBtn.classList.remove('hidden');
  }
}

// handling requests

function sendData(data) {
  fetch(`${SERVER_URL}/detect`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "imageData": data.data1.replace('data:image/png;base64,', ''),
      "modelId": 0
    })
  })
    .then(response => {
      response.json().then(data => {
        setObjectDetectionPloygon(data);
        processLoaderIcon('processBtn');
      })

    }).catch(() => {
      processLoaderIcon('processBtn');
    });
}

function sendDataDiff(data) {
  fetch(`${SERVER_URL}/detectAllDiff`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      response.json().then(data => {
        setDiffPloygon(data);
        processLoaderIcon("compareBtn");
      })
    }).catch(() => {
      processLoaderIcon("compareBtn");
    });
}

// handling actions

function processAction() {
  resetMap();
  processLoaderIcon('processBtn');
  const lc = document.getElementsByClassName('leaflet-control-layers');
  lc[0].style.visibility = 'hidden';
  domtoimage.toPng(document.getElementById('map'), { quality: 1 })
    .then((dataUrl) => {
      data.data1 = dataUrl;
      lc[0].style.visibility = 'visible';
      sendData(data);
    });
}

function compateAction() {
  processLoaderIcon('compareBtn');
  resetMap();
  const promise = new Promise(resolve => {
    const lc = document.getElementsByClassName('leaflet-control-layers');
    lc[0].style.visibility = 'hidden';
    domtoimage.toPng(document.getElementById('map'), { quality: 1 })
      .then((dataUrl) => {
        data.image1 = dataUrl;
        lc[0].style.visibility = 'visible';
        document.getElementsByClassName('leaflet-control-layers-selector')[1].click();
        setTimeout(() => {
          resolve();
        }, 100)
      });
  });
  promise.then(() => {
    lc[0].style.visibility = 'hidden';
    domtoimage.toPng(document.getElementById('map'), { quality: 1 })
      .then(function (dataUrl) {
        data.image2 = dataUrl;
        lc[0].style.visibility = 'visible';
        data.image1 = data.image1.replace('data:image/png;base64,', '')
        data.image2 = data.image2.replace('data:image/png;base64,', '')
        sendDataDiff(data);
        document.getElementsByClassName('leaflet-control-layers-selector')[0].click();
      });
  })
}

function downloadAction() {
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
}

// handling button events

document.getElementById('processBtn').onclick = function () {
  processAction();
};

document.getElementById('compareBtn').onclick = function () {
  compateAction();
}

document.getElementById('downloadBtn').onclick = function () {
  downloadAction();
};