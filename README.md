# Leaflet GeoJSON Tile Layer 
..with caching for Titanium

Renders GeoJSON tiles on an L.GeoJSON layer and caches to localStorage and a sqlite3 database.

## Regarding caching
This branch uses localStorage caching as the [localCaching](https://github.com/linqcan/leaflet-tilelayer-geojson/tree/localCaching) branch, but it also adds extra fall back in a database cache.

The procedure works like this;
* Check if tile is in localStorage. If so; use it.
* If not in localStorage, check if it is in the database. If so; use it and store in localStorage.
* If not in the database, fetch from server.
* Store tile from server in the database and localStorage, then use it.

The database fallback reduces the need for a network connection and makes sure the tile data survives through the application's lifecycle.
However, database calls introduces some overhead and loading tiles from database versus localStorage will be a bit slower.

## Regarding Titanium
The controller needed to run this version of TileLayer.GeoJSON is included in index.js. Include this code wherever/however you find suitable.

The simplest Titanium application would include index.js as a controller and a view index.xml looking like this:

    <Alloy>
      <Window class="container">
        <WebView id="webView" url="/leaflet.html" touchEnabled="true"/>
      </Window>
    </Alloy>

Where "leaflet.html" is your Leaflet application and is stored under /assets.

## Example usage
The following example shows a GeoJSON Tile Layer for tiles with duplicate features.

Features are deduplicated by comparing the result of the `unique` function for each feature.

        var style = {
            "clickable": true,
            "color": "#00D",
            "fillColor": "#00D",
            "weight": 1.0,
            "opacity": 0.3,
            "fillOpacity": 0.2
        };
        var hoverStyle = {
            "fillOpacity": 0.5
        };

        var geojsonURL = 'http://localhost:8000/states/{z}/{x}/{y}.json';
        var geojsonTileLayer = new L.TileLayer.GeoJSON(geojsonURL, {
                unique: function (feature) { return feature.id; }
            }, {
                style: style,
                onEachFeature: function (feature, layer) {
                    if (feature.properties) {
                        var popupString = '<div class="popup">';
                        for (var k in feature.properties) {
                            var v = feature.properties[k];
                            popupString += k + ': ' + v + '<br />';
                        }
                        popupString += '</div>';
                        layer.bindPopup(popupString);
                    }
                    if (!(layer instanceof L.Point)) {
                        layer.on('mouseover', function () {
                            layer.setStyle(hoverStyle);
                        });
                        layer.on('mouseout', function () {
                            layer.setStyle(style);
                        });
                    }
                }
            }
        );
        map.addLayer(geojsonTileLayer);


## Future development
Functionality currently being worked on:
* Re-unioning feature geometries that have been trimmed to tile boundaries

## Contributors
Thanks to the following people for helping so far:

* [Nelson Minar](https://github.com/NelsonMinar)
* [Alex Barth](https://github.com/lxbarth)
* [Pawel Paprota](https://github.com/ppawel)
