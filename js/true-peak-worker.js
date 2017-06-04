onmessage = function(e) {
	var progress_percent = 0;
	var progress_percent_old = 0;
	var buffers = e.data.buffers;
	var width = e.data.width;
	var true_peak = new Float64Array(width);
	var max = 0;

	// let's calculate a true peak value for each "pixel" of the canvas
	for (var i = 0; i < width; i++){

		// get the sample position in the buffer, that corresponds to this pixel
		var absoluteSamplePos = Math.round(i/width * buffers[0].length);
		// and get the short-term loudness for this position in LKFS
		true_peak[i] = getDBTPAtSamplePosition(buffers, absoluteSamplePos);

		progress_percent = Math.round(i/width * 100);
		if (progress_percent != progress_percent_old){
			postMessage({type: "progress", progress: progress_percent});
			progress_percent_old = progress_percent;
		}

	}

	max = getMaxOfArray(true_peak);

	var response = {
		type: "finished",
		true_peak,
		max
	}

	postMessage(response);

}


function absoluteValueToDBFS(value){
	return 20 * Math.log10(value);
}


function getAbsMaxOfArray(numArray){
	// returning Math.max.apply(null, numArray)
	// will result in "Uncaught RangeError: Maximum call stack size exceeded"
	var max_pos = 0;
	for (var i = 1; i < numArray.length; i++){
		if (Math.abs(numArray[i]) > Math.abs(numArray[max_pos])){
			max_pos = i;
		}
	}
	return Math.abs(numArray[max_pos]);
}


function getMaxOfArray(numArray) {
	// returning Math.max.apply(null, numArray);
	// will result in "Uncaught RangeError: Maximum call stack size exceeded"
	var max_pos = 0;
	for (var i = 1; i < numArray.length; i++){
		if (numArray[i] > numArray[max_pos]){
			max_pos = i;
		}
	}
	return numArray[max_pos];
}


function getDBTPAtSamplePosition(buffers, samplePos){

	var time_frame = 0.5; //seconds
	var numberOfSamples = Math.round(192000 * time_frame);
	var lengthOfLeftBuffer = buffers[0].length;
	var channelCount = buffers.length;

	//put all samples of all channels in one array
	var samples = new Float32Array(channelCount * numberOfSamples);
	var i = 0;

	for (var c = 0; c < channelCount; c++){
		for (var s = samplePos - numberOfSamples; s <= samplePos; s++){
			if (s >= 0){
				samples[i] = buffers[c][s];
			} else {
				samples[i] = 0;
			}
			i++;
		}
	}

	var value = getAbsMaxOfArray(samples);
	var value_db = absoluteValueToDBFS(value) + 6.02; //restore original gain
	return value_db;
}
