onmessage = function(e) {
	
	var progress_percent = 0;
	var progress_percent_old = 0;
	var filtered_buffers = e.data.filtered_buffers;
	var untouched_buffers = e.data.untouched_buffers;
  
	var width = e.data.width;
  
	var loudness = new Float64Array(width);
	var psr = new Float32Array(width);

	console.log("Starting with analysing loudness");
  
	//calculate a short term loudness value for each "pixel" of canvas
	for (var i = 0; i < width; i++){
		
		var absoluteSamplePos = Math.round(i/width * filtered_buffers[0].length);
		loudness[i] = getShortTermLoudnessAtSamplePosition(filtered_buffers, absoluteSamplePos);
		psr[i] = getPSRAtSamplePosition(untouched_buffers, absoluteSamplePos, loudness[i]);
	
		progress_percent = Math.round(i/width * 100);
	
		if (progress_percent != progress_percent_old){
			postMessage({type: "progress", progress: progress_percent});
			progress_percent_old = progress_percent;	
		}
	
	}

  
	var response = {
	  
		type: "finished",
		loudness: loudness,
		psr: psr
	
	}
  
	postMessage(response);
  
}


function absoluteValueToDBFS(value){

	return 20 * Math.log10(value);	

}


function getAbsMaxOfArray(numArray){

  //return Math.max.apply(null, numArray);
  //this will result in "Uncaught RangeError: Maximum call stack size exceeded"
  
	var max_pos = 0;
  
	for (var i = 1; i < numArray.length; i++){
  
		if (Math.abs(numArray[i]) > Math.abs(numArray[max_pos])){
			max_pos = i;
		}
  
	}
  
	return Math.abs(numArray[max_pos]);

}


function getMaxOfArray(numArray) {
  //return Math.max.apply(null, numArray);
  //this will result in "Uncaught RangeError: Maximum call stack size exceeded"
  
	var max_pos = 0;
  
	for (var i=1; i < numArray.length; i++){
  
		if (numArray[i] > numArray[max_pos]){
			max_pos = i;
		}
  
	}
  
	return numArray[max_pos];
  
}


function getShortTermLoudnessAtSamplePosition(buffers, pos){

	// From EBU TECH 3341:
	// The short-term loudness uses a sliding rectangular time window of length 3 s. The
	// measurement is not gated. The update rate for ‘live meters’ shall be at least 10 Hz.
	var time_frame = 3; //seconds
	var samplesCount = Math.round(44100 * time_frame);

	//for every channel one loudness value
	var channel_loudness_values = new Float32Array(buffers.length);
	
	//master loudness
	var loudness = 0;
	
	//calculate loudness for each channel
	for (var c = 0; c < buffers.length; c++){
	
		var samplesForCalculation = new Float32Array(samplesCount);
		var i = 0;
		
		for (var s = pos - samplesCount + 1; s <= pos; s++){
		
			if (s >= 0){

				samplesForCalculation[i] = 2 * buffers[c][s];

			}
		
			else {
				samplesForCalculation[i] = 0;
			}
		
			i++;
			
		}
		
		channel_loudness_values[c] = ms(samplesForCalculation);
		
		/*
			No channel weigthing applied here, as we're currently only evaluation mono/stereo files with L=1.0 and R=1.0
		*/
		
		loudness += channel_loudness_values[c];
		
	}
	
	//see ITU-R BS.1770-4 equation 2
	var loudness_lkfs = -0.691 + (10 * Math.log10(loudness));
	
	return loudness_lkfs;

}


function getPSRAtSamplePosition(buffers, samplePos, loudness_value){

	var time_frame = 3; //seconds
	var samplesCount = Math.round(44100 * time_frame);

	var length = buffers[0].length;

	//put all samples of all channels in one array
	var samples = new Float32Array(buffers.length * samplesCount);
	var i = 0;
	
	for (var c = 0; c < buffers.length; c++){
	
		for (var s = samplePos - samplesCount; s <= samplePos; s++){
		
			if (s >= 0){

				samples[i] = buffers[c][s];

			}
		
			else {
				samples[i] = 0;
			}
		
			i++;
			
		}
	
	}
	
	var x_peak = getAbsMaxOfArray(samples);
	
	var x_peak_db = absoluteValueToDBFS(x_peak);
	
	var psr = x_peak_db - loudness_value;
	
	return psr;

}


function ms(samples){

	var squared_samples = 0;
	
	for (var s = 0; s < samples.length; s++){
	
		squared_samples += Math.pow(samples[s], 2);
	
	}
	
	var ms = (1 / samples.length) * squared_samples;
	
	return ms;
	
}