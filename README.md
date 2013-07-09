# Leaflet GeoJSON Tile Layer witch caching
Renders GeoJSON tiles on an L.GeoJSON layer and caches tiles in localStorage.

## Regarding caching
Caching is done using localStorage, which is basically a key-value storage.
The cache is regarded as valid "forever", so if you have changing data (changing more often than the browser session) you might want to clear localStorage from time to time; localStorage.clear()
More about localStorage persistence can be found [here](http://stackoverflow.com/questions/9948284/how-persistent-is-localstorage)

The key is determined by the parseKey function and it is currently assuming a TileStache server. You made need to tweak the regular expression pattern to fit your needs.
For example, if you are using [OpenStreetMap GeoJSON](http://openstreetmap.us/~migurski/vector-datasource/) data you migt want to change the matching pattern to:
<pre>
.*openstreetmap.us/(.*)
</pre>

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
