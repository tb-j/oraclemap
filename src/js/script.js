// /* eslint-disable no-undef */
const lc = document.getElementsByClassName('leaflet-control-layers');
const loader = document.getElementById("loader");
loader.classList.add('hidden')

function loading() {
  const processBtn = document.getElementById("processBtn");
  if (loader.classList.contains('hidden')) {
    loader.classList.remove('hidden');
    processBtn.classList.add('hidden')
  } else {
    loader.classList.add('hidden');
    processBtn.classList.remove('hidden');
  }
}

document.getElementById('downloadBtn').onclick = function () {
  debugger;
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

function sendData(data) {
  fetch('https://iccc-s019.pl.oracle.com:9001/detect', {
    method: 'POST',
    // crossorigin: true,
    // mode: 'no-cors',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      // 'Access-Control-Allow-Origin':'*',
    },
    body: JSON.stringify({
      "imageData": data.data1.replace('data:image/png;base64,', ''),
      // "format": "jpg",
      // "confidence": 0.5,
      // "size": 2680
    })
  })
    .then(response => {
      // console.log('Server responded with: ' + response.json());
      response.json().then(data => {
        setPloygon(data);
        loading();
      })

    }).catch(() => {
      // setPloygon();
      loading();
    });
}

const data = {};
document.getElementById('processBtn').addEventListener('click', e => {
  // window.polygon.remove()
  polylines.forEach(pl => {
    map.removeLayer(pl)
  })
  tooltips.forEach(tl => {
    map.removeLayer(tl)
  })
  loading();
  const lc = document.getElementsByClassName('leaflet-control-layers');
  lc[0].style.visibility = 'hidden';

  domtoimage.toPng(document.getElementById('map'), { quality: 1 })
    .then((dataUrl) => {
      data.data1 = dataUrl;
      lc[0].style.visibility = 'visible';
      sendData(data);
      // document.getElementsByClassName('leaflet-control-layers-selector')[1].click();
      // setTimeout(() => {
      //   resolve(e);
      // }, 100)
    });

}, { once: false });
// const promise = new Promise(resolve => {
//   document.getElementById('processBtn').addEventListener('click', e => {
//     loading();
//     const lc = document.getElementsByClassName('leaflet-control-layers');
//     lc[0].style.visibility = 'hidden';

//     domtoimage.toPng(document.getElementById('map'), { quality: 1 })
//       .then((dataUrl) => {
//         data.data1 = dataUrl;
//         lc[0].style.visibility = 'visible';
//         // document.getElementsByClassName('leaflet-control-layers-selector')[1].click();
//         setTimeout(() => {
//           resolve(e);
//         }, 100)
//       });

//   }, { once: true });
// })
// promise.then(() => {
//   sendData(data);
//   // lc[0].style.visibility = 'hidden';
//   // domtoimage.toPng(document.getElementById('map'), { quality: 1 })
//   //   .then(function (dataUrl) {
//   //     data.data2 = dataUrl;
//   //     lc[0].style.visibility = 'visible';
//   //     sendData(data);
//   //   });
// })

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

const overlayLayers = {};
const layerControl = L.control.layers(baseLayers, overlayLayers, {
  collapsed: false
}).addTo(map);

const la = document.getElementsByClassName('leaflet-control-attribution');
la[0].style.visibility = 'hidden';

const polylines = [];
const tooltips = [];
function setPloygon(res) {
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
    polylines.push(firstpolyline);
    firstpolyline.addTo(map);
  })


}



