/**
 * Converts the given data structure to a JSON string.
 * Argument: arr - The data structure that must be converted to JSON
 * Example: var json_string = array2json(['e', {pluribus: 'unum'}]);
 *          var json = array2json({"success":"Sweet","failure":false,"empty_array":[],"numbers":[1,2,3],"info":{"name":"Binny","site":"http:\/\/www.openjs.com\/"}});
 * http://www.openjs.com/scripts/data/json_encode.php
 */
function array2json(arr) {
    var parts = [];
    var is_list = (Object.prototype.toString.apply(arr) === '[object Array]');
    
    for(var key in arr) {
        var value = arr[key];
        if(typeof value == "object") { //Custom handling for arrays
            if(is_list) parts.push(array2json(value)); /* :RECURSION: */
            else parts[key] = array2json(value); /* :RECURSION: */
        } else {
            var str = "";
            if(!is_list) str = '"' + key + '":';

            //Custom handling for multiple data types
            if(typeof value == "number") str += value; //Numbers
            else if(value === false) str += 'false'; //The booleans
            else if(value === true) str += 'true';
            else str += '"' + value + '"'; //All other things
            // :TODO: Is there any more datatype we should be in the lookout for? (Functions?)

            parts.push(str);
        }
    }
    var json = parts.join(",");
    if(is_list) return '[' + json + ']';//Return numerical JSON
    return '{' + json + '}';//Return associative JSON
}

function OrderPosition2OrderId(ordersArr, position) {
	var counter = 0;
	ordersArr = sortArrByKey(ordersArr);
	for(i in ordersArr) {
		if(counter == position) {
			return ordersArr[i].order_id;
		} else {
			counter++;
		}
	}
	return undefined
}

function OrderId2OrderPosition(ordersArr, id) {
	var counter = 0;
	ordersArr = sortArrByKey(ordersArr);
	for(i in ordersArr) {
		if(id == i) {
			return counter;
		} else {
			counter++;
		}
	}
	return undefined;
}
function sortArrByKey(array) {
	var sortedArr = new Array();
    var keys = new Array();
    for(k in array)
    {
         keys.push(k);
    }

    keys.sort( function (a, b){
    	return (a>b)-(a<b);
    	}
    );

    for (var i = 0; i < keys.length; i++)
    {
    	sortedArr[keys[i]] = array[keys[i]];        
    }
    return sortedArr
}
function objKeyCount(array) {
	var count = 0;
	for (var k in array) {
	    if (array.hasOwnProperty(k)) {
	       ++count;
	    }
	}
	return count;
}
function convertSpacePosToPixel(pos, universeMin, universeMax) {
	/*
	 * Takes the pos of an object and translates that position based on the viewport
	 * 
	 * pos - The xy of an object in space
	 * universeMin - An obj array of the minimum pos of the universe
	 * universeMax - An obj array of the maximum pos of the universe 
	 */
	
	/*
	var universeMin = {'x': universe.Size.minX, 'y': universe.Size.minY};
    var universeMax = {'x': universe.Size.maxX, 'y': universe.Size.maxY};
    
    var universeW = universe.Size.maxX - universe.Size.minX;
	var universeH = universe.Size.maxY - universe.Size.minY;
	
	pixalPos = convertSpacePosToPixel(obj.Position, universeMin, universeMax);
	*/
	
	universeW = universeMax.x - universeMin.x;
	universeH = universeMax.y - universeMin.y;
	
	percentX = (pos.x - universeMin.x) / universeW;
    percentY = (pos.y - universeMin.y) / universeH;
    
    //alert($("#map-scroll").position().left);
    //alert(percentX + " " + percentY);
    
    //Switch around the height value because css goes negative then positive instead of the other way around.
    return {'x': percentX * $(window).width(), 'y': $(window).height() - (percentY * $(window).height())};
    
}

function countNumberDigits(num, sizeNum) {
	/*
	 * counts how many digits a number has so that the size of the universe can be determined. 
	 * 
	 * num - Needs to be positive
	 * sizeNum - the number that acts as a boundary to stop the digit counter. 
	 */
	
	var digitNum = 1;
	
	while(num > sizeNum + 50 ) {
		num = num * 0.1;
		digitNum = digitNum * 10;
	}
	
	return digitNum;
	
}
function determineLesserNumber(num1, num2) {
	if(num1 < num2) 
		return num1;
	else
		return num2;
}
function SpacePostoPixel(x, y) {
	pixX = x / Map.UniverseSize;
	pixY = y / Map.UniverseSize;
	return {'x': pixX, 'y': pixY};

}