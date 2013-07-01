// Load data tiles using the JQuery ajax function
L.TileLayer.Ajax = L.TileLayer.extend({
    _requests: [],
    _data: [],
    _currentTileUrl: '',
    _index: 0,
    initialize: function(url, options) {
    	//Unsafe, what happens if layers randomly get the same index?
    	this._index = Math.floor((Math.random()*100)+1);
        L.TileLayer.prototype.initialize.call(this, url, options);
    },
    data: function () {
        for (var t in this._tiles) {
            var tile = this._tiles[t];
            if (!tile.processed) {
                this._data = this._data.concat(tile.datum);
                tile.processed = true;
            }
        }
        return this._data;
    },
    _addTile: function(tilePoint, container) {
        var tile = { datum: null, processed: false };
        this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;
        this._loadTile(tile, tilePoint);
    },
    // XMLHttpRequest handler; closure over the XHR object, the layer, and the tile
    _xhrHandler: function (req, layer, tile, url) {
    	var key = this._parseKey(url);
        return function() {
            if (req.readyState != 4) {
                return;
            }
            var s = req.status;
            if ((s >= 200 && s < 300) || s == 304) {
                tile.datum = JSON.parse(req.responseText);
            	if (url) {
                    Ti.App.fireEvent('app:writeTileToCache', { url: url, data: tile.datum, key: key });
                    localStorage[key] = req.responseText;
               } else {
                    layer._tileLoaded();
               }
            }
            layer._tileLoaded();
        };
    },
    // Load the requested tile via AJAX
    _loadTile: function (tile, tilePoint) {
        this._adjustTilePoint(tilePoint);
        this._currentTileUrl = this.getTileUrl(tilePoint);
        var key = this._parseKey(this._currentTileUrl);
        if (localStorage[key]) {
            //Tile is in localStorage, get it!
            tile.datum = JSON.parse(localStorage[key]);
            this._tileLoaded();
        } else{
            //Get tile from database, or via HTTP
            Ti.App.fireEvent('app:readTileFromCache', { index: this._index, x: tilePoint.x, y: tilePoint.y, url: this._currentTileUrl, key: key });
        }
    },
    _resetCallback: function() {
        this._data = [];
        L.TileLayer.prototype._resetCallback.apply(this, arguments);
        for (var i in this._requests) {
            this._requests[i].abort();
        }
        this._requests = [];
    },
    _update: function() {
        if (this._map._panTransition && this._map._panTransition._inProgress) { return; }
        if (this._tilesToLoad < 0) this._tilesToLoad = 0;
        L.TileLayer.prototype._update.apply(this, arguments);
    },
    _tileCallback: function (response) {
    	if (this._tilesToLoad < 0) {
    		return;
    	}
    	var tile = this._tiles[response.x + ':' + response.y];
    	if (!tile) {
            Ti.API.error('Tile is undefined for x=' + response.x + ' y=' + response.y );
            return;
    	}
        if (response.data) {
            //Tile exists in database
            localStorage[response.key] = JSON.stringify(response.data);
            tile.datum = response.data;
            this._tileLoaded();
        } else {
            //Tile doesn't exist in database, get via HTTP
            var req = new XMLHttpRequest();
            this._requests.push(req);
            req.onreadystatechange = this._xhrHandler(req, this, tile, response.url).bind(this);
            req.open('GET', response.url, true);
            req.send();
        }
    },
    onAdd: function (map) {
    	Ti.App.addEventListener('app:returnTileFromCache' + this._index, this._tileCallback.bind(this));
        L.TileLayer.prototype.onAdd.call(this, map);
    },
    onRemove: function(map) {
    	Ti.App.removeEventListener('app:returnTileFromCache' + this._index, this._tileCallback.bind(this));
        L.TileLayer.prototype.onRemove.call(this, map);
    },
    _parseKey: function(tileUrl) {
    	if (!tileUrl) {
            return null;
    	}
    	// Assumes a TileStache server with url: 
        // http://myhost/tiles/tiles.py/layer/z/x/y.geojson
        var patt1 = new RegExp(".*tiles.py/(.*)");
        var result = patt1.exec(tileUrl);
        if (result[1]) {
            return result[1];
        } else {
            return tileUrl;
        }
    }
});

L.TileLayer.GeoJSON = L.TileLayer.Ajax.extend({
    _geojson: {"type":"FeatureCollection","features":[]},
    initialize: function (url, options, geojsonOptions) {
        L.TileLayer.Ajax.prototype.initialize.call(this, url, options);
        this.geojsonLayer = new L.GeoJSON(this._geojson, geojsonOptions);
        this.geojsonOptions = geojsonOptions;
    },
    onAdd: function (map) {
        this._map = map;
        this.on('load', this._tilesLoaded);
        L.TileLayer.Ajax.prototype.onAdd.call(this, map);
        map.addLayer(this.geojsonLayer);
    },
    onRemove: function (map) {
        map.removeLayer(this.geojsonLayer);
        this.off('load', this._tilesLoaded);
        L.TileLayer.Ajax.prototype.onRemove.call(this, map);
    },
    data: function () {
        this._geojson.features = [];
        if (this.options.unique) {
            this._uniqueKeys = {};
        }
        var tileData = L.TileLayer.Ajax.prototype.data.call(this);
        for (var t in tileData) {
            var tileDatum = tileData[t];
            if (tileDatum && tileDatum.features) {

                // deduplicate features by using the string result of the unique function
                if (this.options.unique) {
                    for (var f in tileDatum.features) {
                        var featureKey = this.options.unique(tileDatum.features[f]);
                        if (this._uniqueKeys.hasOwnProperty(featureKey)) {
                            delete tileDatum.features[f];
                        }
                        else {
                            this._uniqueKeys[featureKey] = featureKey;
                        }
                    }
                }
                this._geojson.features =
                    this._geojson.features.concat(tileDatum.features);
            }
        }
        return this._geojson;
    },
    _resetCallback: function () {
        this._geojson.features = [];
        L.TileLayer.Ajax.prototype._resetCallback.apply(this, arguments);
    },
    _tilesLoaded: function (evt) {
        this.geojsonLayer.clearLayers().addData(this.data());
    }
});
