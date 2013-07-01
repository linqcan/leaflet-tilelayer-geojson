var app = Ti.App;

app.addEventListener('app:readTileFromCache', function (tile){
	//Get tile data from database, if any
	var key = tile.key;
	if (key) {
		var data = getTileData(key);
		Ti.App.fireEvent('app:returnTileFromCache' + tile.index, { x: tile.x, y: tile.y, url: tile.url, data: data, key: key });
	} else {
		Ti.API.error('readTileFromCache: Could not parse key from ' + tile.url);
	}
});


app.addEventListener('app:writeTileToCache', function (tile) {
	var key = tile.key;
	if (key) {
		var success = writeTileData(key, tile.data);
		Ti.App.fireEvent('app:returnWriteResult', { key: key, success: success });
	} else {
		Ti.API.error('writeTileToCache: Could not parse key from ' + tile.url);
	}
});

function getDatabase() {
	var _db = Ti.Database.open('tileCache');
	_db.execute('CREATE TABLE IF NOT EXISTS tiles (id INTEGER PRIMARY KEY, url TEXT, data TEXT)');
	//_db.file.setRemoteBackup(false); //Might be needed on iOS
	return _db;
}

function getTileData(key) {
	var db = getDatabase();
	var rows = db.execute('SELECT data FROM tiles WHERE url = ?', key);
	var data = '';
	if (rows.isValidRow()) {
		data = JSON.parse(rows.fieldByName('data'));
		log('Loaded tile with key ' + key + ' from database');
	}
	rows.close();
	db.close();
	return data;
}

function writeTileData(key, data) {
	if (tileExists(key)) {
		Ti.API.info('Tile already in database!');
		return false;
	} else {
		var db = getDatabase();
		db.execute('INSERT INTO tiles (url,data) VALUES(?,?)', key, JSON.stringify(data));
		var rowId = db.lastInsertRowId;
		db.close();
		if (rowId > 0) {
			log('Wrote tile with key ' + key + ' to database');
			return true;
		} else {
			return false; //Insert failed somehow, right?
		}
	}
}

function tileExists(key) {
	var db = getDatabase();
	var rows = db.execute('SELECT id FROM tiles WHERE url = ?', key);
	var count = rows.rowCount;
	rows.close();
	db.close();
	return count > 0;
}

function log (msg) {
	//Ti.API.info(msg);
}
$.index.open();
