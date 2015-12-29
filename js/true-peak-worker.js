

onmessage = function(e) {
	
  var buffers = e.data.buffer;
  
  var width = e.data.width;
  
  console.log("Starting with true peak scan");
 
  var max_pos = 0;
  var channel_of_max_pos = 0;
  
  for (var b = 0; b < buffers.length; b++){
  
	  for (var i=0; i < buffers[b].length; i++){
	  
		if (Math.abs(buffers[b][i]) > Math.abs(buffers[channel_of_max_pos][max_pos])){
			max_pos = i;
			channel_of_max_pos = b;
		}

	  }
	  
	}
	
	// times 2 to compensate for the gain attenuation before
	var max = buffers[channel_of_max_pos][max_pos];
	var max_db = absoluteValueToDBFS(max);
  
  var response = {
	type: "finished",
	max: max,
	max_db: max_db
  }
  
  postMessage(response);
  
}


function getAbsMaxOfArray(numArray){

  //return Math.max.apply(null, numArray);
  //this will result in "Uncaught RangeError: Maximum call stack size exceeded"
  
  var max_pos = 0;
  
  for (var i=1; i < numArray.length; i++){
  
	if (Math.abs(numArray[i]) > Math.abs(numArray[max_pos])){
		max_pos = i;
	}
  
  }
  
  return Math.abs(numArray[max_pos]);

}


function absoluteValueToDBFS(value){

	return 20 * Math.log10(Math.abs(value));	

}

function msInDBFS(value){

	return 10 * Math.log10(Math.abs(value));	

}