function DragTileMap(target) {

    this.tilesize = 256;

    // general properties
    this.target = $(target);
    this.shownMap = [];

    // dom properties / handlers
    this.vp = $(document.createElement('div'));
    this.vp.attr('id', 'scrollMapViewport');
    this.vp.css({'position': 'relative', 'overflow': 'hidden', 'height': ($(window).height() - parseInt(this.target.offset().top, 10))+'px'});
    this.target.append(this.vp);

    this.mapc = $(document.createElement('div'));
    this.mapc.attr('id', 'scrollMapCanvasContainer');
    this.mapc.css({'position': 'absolute', 'top': '0px', 'left': '0px'});
    this.vp.append(this.mapc);

    this.canvas = $(document.createElement('div'));
    this.canvas.attr('id', 'MapCanvas');
    this.canvas.css({'position': 'absolute', 'top': '0px', 'left': '0px', 'zIndex': '5'});
    this.mapc.append(this.canvas);

    this.map = $(document.createElement('div'));
    this.map.attr('id', 'scrollMapCanvas');
    this.map.css({'position': 'absolute', 'top': '0px', 'left': '0px'});
    this.mapc.append(this.map);

    // handle events
    this.vp.bind("mousedown", this, function(e) {

        e.data.target_offset = e.data.target.offset();
        var page = [e.pageX - e.data.target_offset.left, e.pageY - e.data.target_offset.top];

        var xpos = page[0] - parseInt(e.data.mapc.css('left'), 10);
        var ypos = (e.data.tilesize) + (parseInt(e.data.mapc.css('top'), 10) - page[1]);

        $('#debug-1').text('Position: ('+ xpos + ', ' + ypos + ')');

        var temp = new Array();
        temp = e.target.id.split('_');
        if(temp.length == 3) {
            var xbounds = [(parseInt(temp[1], 10) * e.data.tilesize), (parseInt(temp[1], 10) * e.data.tilesize + (e.data.tilesize-1))];
            var ybounds = [(parseInt(temp[2], 10) * e.data.tilesize), (parseInt(temp[2], 10) * e.data.tilesize + (e.data.tilesize-1))];
            $('#debug-2').text('Tile X: ' + temp[1] + ' [' + xbounds[0] + ', ' + xbounds[1] + ']');
            $('#debug-3').text('Tile Y: ' + temp[2] + ' [' + ybounds[0] + ', ' + ybounds[1] + ']');
        } else {
            $('#debug-2').text('No X tile');
            $('#debug-3').text('No Y tile');
        }

        if(!e.data.mapc.moving) {
            e.data.mapc.posx = page[0];
            e.data.mapc.posy = page[1];
            e.data.mapc.moving = true;
            e.data.target.everyTime(400, function(i) {
                e.data.redraw();
            }, 25);
        }
        return false;
    });
        
    $(document).bind("mousemove", this, function(e) {
        if(e.data.mapc.moving) {
            var cposx = e.pageX - e.data.target_offset.left;
            var cposy = e.pageY - e.data.target_offset.top;
            e.data.mapc.css('top', (parseInt(e.data.mapc.css('top'), 10) + (cposy - e.data.mapc.posy))+'px');
            e.data.mapc.css('left', (parseInt(e.data.mapc.css('left'), 10) + (cposx - e.data.mapc.posx))+'px');
            e.data.mapc.posx = cposx;
            e.data.mapc.posy = cposy;
        }
        return false;
    });

    $(document).bind("mouseup", this, function(e) {
        if(e.data.mapc.moving) {
            e.data.target.stopTime();
            e.data.mapc.moving = false;
            e.data.redraw();
        }
        return false;
    });

    $(window).bind("resize", this, function(e) {
        // Set the height of the viewport
        e.data.vp.css('height', ($(window).height() - parseInt(e.data.target.offset().top, 10))+'px');

        e.data.oldvpCols = e.data.vpCols;
        e.data.oldvpRows = e.data.vpRows;

        // Number of columns and rows in the viewport
        e.data.vpCols = Math.round((e.data.target.width() / e.data.tilesize) + .5)+1;
        e.data.vpRows = Math.round((e.data.target.height() / e.data.tilesize) + .5)+1;

        // First draw of the map
        e.data.redraw();
    });

    // methods
    this.init = function(x, y) {
        // Set center values so we always can get them fast
        this.center = [x, y];

        // Number of columns and rows in the viewport
        this.vpCols = this.oldvpCols = Math.round((this.target.width() / this.tilesize) + .5)+1;
        this.vpRows = this.oldvpRows = Math.round((this.target.height() / this.tilesize) + .5)+1;

        // Center map on x,y
        this.mapc.css('top', (((this.target.height()/2) + y)-(this.tilesize))+'px');
        this.mapc.css('left', ((this.target.width()/2) + -x)+'px');

        // Calculate most left column and most top row
        this.oldStartRow = Math.round((parseInt(this.mapc.css('top'), 10)/this.tilesize)+.5) +1;
        this.oldStartCol = -1*Math.round((parseInt(this.mapc.css('left'), 10)/this.tilesize)+.5) -1;

        // First draw of the map
        this.redraw();
    }
    this.redraw = function() {

        // Calculate most left column and most top row (like in init)
        var startRow = Math.round((parseInt(this.mapc.css('top'), 10)/this.tilesize)+.5) +1;
        var startCol = -1*Math.round((parseInt(this.mapc.css('left'), 10)/this.tilesize)+.5) -1;

        // Calculate most right column and most bottom row
        var endRow = startRow - this.vpRows;
        var endCol = startCol + this.vpCols;

        // Make sure the loop gets as big as possible
        // This is so that we can remove old entries that is offscreen now
        var si = Math.max(this.oldStartRow, startRow);
        var sj = Math.min(this.oldStartCol, startCol);
        var ei = Math.min(this.oldStartRow - Math.max(this.oldvpRows, this.vpRows), endRow);
        var ej = Math.max(this.oldStartCol + Math.max(this.oldvpCols, this.vpCols), endCol);

        // Loop, i = row, j = column
        for(var i = si; i >= ei; i--) {
            for(var j = sj; j <= ej; j++) {
                if(i > startRow || i < endRow || j < startCol || j > endCol) {
                    if(this.shownMap[i] && this.shownMap[i][j]) {
                        $('#map_'+j+'_'+i).remove();
                        this.shownMap[i][j] = null;
                    }
                } else {
                    if(!this.shownMap[i]) this.shownMap[i] = [];
                    if(!this.shownMap[i][j]) {
                        var timg = $(document.createElement('img'));
                        timg.attr({'id': 'map_'+j+'_'+i, 'src': 'images/map_'+j+'_'+i+'.png'});
                        timg.css({'position': 'absolute', 
                                  'width': this.tilesize+'px',
                                  'height': this.tilesize+'px', 
                                  'top': (i*this.tilesize*-1)+'px',
                                  'left': (j*this.tilesize)+'px',
                                  'MozUserSelect': 'none'});
                        $(this.map).append(timg);
                        this.shownMap[i][j] = true;
                        timg = null;
                    }
                }
            }
        }
        this.oldStartRow = startRow;
        this.oldStartCol = startCol;
    }

    this.drawobject = function(x, y, text) {
        var test = $(document.createElement('div'));
        test.attr('id', 'object-1');
        test.css({'position': 'absolute', 'top': (this.tilesize) - y+'px', 'left': x+'px', 'background-color': 'yellow', 'width': '10px', 'height': '10px'});
        test.text(text);
        this.canvas.append(test);
    }
}

$(document).ready(function () {
    var map = new DragTileMap('#mapdiv');
    map.init(575, 275);
    for(var i = 0; i < 250; i++) {
        map.drawobject(i*5, i*5);
        map.drawobject(-i*5, i*5);
    }
    /*$.getJSON('http://space.xvid.se/json/planets/', function(planet) {
        for(pid in planet) {
            map.drawobject(planet[pid]['coordinate']['x'], planet[pid]['coordinate']['y'], planet[pid]['name']);
        }
    });*/
    $('#hide').click(function(e) {
        $('#panel').hide();
    });
});

