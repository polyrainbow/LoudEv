var wavesurfer = null;
var combined;
var loudness_canvas = null;
var psr_canvas;

var loudness = null;
var psr = null;

var loudness_display = null;
var psr_display = null;


function getRMSAtRelativePosition(buffer, relativePos){

	//samples count of last 300ms, with sampleRate of 44100 Samples/sec = 13230
	var samplesCountOfLast300ms = Math.round(wavesurfer.backend.ac.sampleRate);

	var length = buffer.length;

	var absoluteSamplePos = Math.round(relativePos * buffer.length);
	
	
	var ms = 0;
	for (var s = absoluteSamplePos - samplesCountOfLast300ms; s <= absoluteSamplePos; s++){
	
		if (s >= 0){
			ms += Math.pow(buffer[s], 2);
		}
	
		else {
			continue;
		}
	
	}
	
	ms = (1 / samplesCountOfLast300ms) * ms;
	
	var rms = Math.sqrt(ms);
	
	return rms;

}


function absInDBFS(value){

	return 20 * Math.log10(Math.abs(value));	

}

function getMaxOfArray(numArray) {
  return Math.max.apply(null, numArray);
}


function getCrestFactorAtRelativePosition(buffers, relativePos){

	//samples count of last 300ms, with sampleRate of 44100 Samples/sec = 13230
	var samplesCountOfLast300ms = Math.round(wavesurfer.backend.ac.sampleRate);

	var length = buffers[0].length;

	var absoluteSamplePos = Math.round(relativePos * length);
	
	var samples = new Float32Array(samplesCountOfLast300ms);
	var i = 0;
	
	for (var s = absoluteSamplePos - samplesCountOfLast300ms; s <= absoluteSamplePos; s++){
	
		if (s >= 0){
			//currently only use left channel
			samples[i] = buffers[0][s];

		}
	
		else {
			samples[i] = 0;
		}
	
		i++;
		
	}
	
	var x_peak = getMaxOfArray(samples);
	

	var rms = getRMSAtRelativePosition(buffer, relativePos);
	
	var c = x_peak / rms;
	
	return c;


}


function renderRMS(wavesurfer){

	loudness_canvas = dom.make("canvas", "loudness_canvas", "", g("loudness_div"));
	loudness_canvas.style.width = "100%";
	loudness_canvas.style.height = "150px";
	
	psr_canvas = dom.make("canvas", "psr_canvas", "", g("psr_div"));
	psr_canvas.style.width = "100%";
	psr_canvas.style.height = "150px";

	var canvas_width = loudness_canvas.getBoundingClientRect().width * 2;
	var canvas_height = loudness_canvas.getBoundingClientRect().height * 2;

	var leftChannel = wavesurfer.backend.buffer.getChannelData(0);
	var rightChannel = wavesurfer.backend.buffer.getChannelData(1);
	
	
	//get a resampled audioBuffer
	var lengthInSeconds = leftChannel.length / wavesurfer.backend.ac.sampleRate;
	var targetSampleRate = 48000;
	var OAC = new OfflineAudioContext(2, lengthInSeconds * targetSampleRate, targetSampleRate);
	var source = OAC.createBufferSource();
	source.buffer = wavesurfer.backend.buffer;
	source.connect(OAC.destination);
	source.start();
	//OAC.oncomplete = function(audioBufferResampled){
  
	OAC.startRendering().then(function(renderedBuffer) {
	
		console.log('Rendering completed successfully');
		console.log('Now we have a buffer in 48000, required for EBU analysis');
			
		var leftChannel48kHz = renderedBuffer.getChannelData(0);
		var rightChannel48kHz = renderedBuffer.getChannelData(1);
		
	
		var myWorker = new Worker("js/loudness-worker.js");
		myWorker.postMessage({buffer: [leftChannel48kHz, rightChannel48kHz], width: canvas_width}); // Sending message as an array to the worker
		console.log('Data to analyse posted to worker');

	
		myWorker.onmessage = function(e) {
			
			var data = e.data;
			
			if (data.type == "finished"){
				
				console.log('Message received from worker');
				console.log(data);
				
				dom.remove(g("loudness_progress"));
				g("conducting_loudness_analysis").style.display = "none";
				
				loudness = data.loudness;
				psr = data.psr;
				
				drawLoudnessDiagram(loudness);
				drawPSRDiagram(psr);
				
				wavesurfer.play();
				
			}
			
			if (data.type == "progress"){
				
				g("loudness_progress").value = data.progress;
				g("progress_value_disp").innerHTML = data.progress;
				
			}
			
			
		};
		
	});
	
	

}


var drawLoudnessDiagram = function(loudness){


	var canvas_width = loudness_canvas.getBoundingClientRect().width * 2;
	var canvas_height = loudness_canvas.getBoundingClientRect().height * 2;
	//set canvas height and width manually
	loudness_canvas.setAttribute("width", canvas_width);
	loudness_canvas.setAttribute("height", canvas_height);
	var ctx = loudness_canvas.getContext("2d");
	
	//calculate RMS for every pixel
	for (var i = 0; i < canvas_width; i++){
	
		ctx.beginPath();
		ctx.lineWidth = 1;
		
		if (loudness[i] < 6){
		
			ctx.strokeStyle = '#000000';
		
		}
		
		else if (loudness[i] < 9){
			ctx.strokeStyle = '#ff0000';
		}
		
		
		else if (loudness[i] < 9.5){
			ctx.strokeStyle = '#ffaa00';
		}
		
		
		else if (loudness[i] < 10){
			ctx.strokeStyle = '#ffff00';
		}
		
		else {
		
			ctx.strokeStyle = '#00ff00';
		
		}
		
		//typical crest factors are -20 to -3 dbFS
		var lineHeight = canvas_height * ((loudness[i] + 30) / 30);
	
		ctx.moveTo(i, canvas_height);
		ctx.lineTo(i, canvas_height - lineHeight);
		ctx.stroke();
	
	}


}


var drawPSRDiagram = function(loudness){

	var loudness_canvas = g("psr_canvas");
	var canvas_width = loudness_canvas.getBoundingClientRect().width * 2;
	var canvas_height = loudness_canvas.getBoundingClientRect().height * 2;
	//set canvas height and width manually
	loudness_canvas.setAttribute("width", canvas_width);
	loudness_canvas.setAttribute("height", canvas_height);
	var ctx = loudness_canvas.getContext("2d");
	
	//calculate RMS for every pixel
	for (var i = 0; i < canvas_width; i++){
	
		ctx.beginPath();
		ctx.lineWidth = 1;
		
		if (loudness[i] < 6){
		
			ctx.strokeStyle = '#000000';  //black
		
		}
		
		else if (loudness[i] < 8){
			ctx.strokeStyle = '#ff0000';  //red
		}
		
		
		else if (loudness[i] < 8.75){
			ctx.strokeStyle = '#ff4500';  //orangered
		}
		
		
		else if (loudness[i] < 9.5){
			ctx.strokeStyle = '#ffa500';
		}
		
		
		else if (loudness[i] < 10.5){
			ctx.strokeStyle = '#ffff00';
		}
		
		
		else if (loudness[i] < 12){
			ctx.strokeStyle = '#b4ff00';
		}
		
		else {
		
			ctx.strokeStyle = '#00ff00';
		
		}
		
		//typical crest factors are -20 to -3 dbFS
		var lineHeight = canvas_height * ((loudness[i] - 4) / 16);
	
		ctx.moveTo(i, canvas_height);
		ctx.lineTo(i, canvas_height - lineHeight);
		ctx.stroke();
	
	}


}


//render an offline audio context to a buffer and make WAV and download it
var renderOACAndDownloadWAV = function(OAC){

		OAC.startRendering().then(function(renderedBuffer) {
			console.log('Rendering completed successfully');
			
			
			renderWAVFileFromAudioBuffer(renderedBuffer, function(blob){
				
				saveAs(blob, "export.wav");
				
			});
			
			

		}).catch(function(err) {
			console.log('Rendering failed: ' + err);
			// Note: The promise should reject when startRendering is called a second time on an OfflineAudioContext
		});
		
}


var renderAndDownloadWAV = function(buffer){

			renderWAVFileFromAudioBuffer(buffer, function(blob){
				
				saveAs(blob, "export.wav");
				
			});
			
}


	var renderWAVFileFromAudioBuffer = function(buffer, then){
	
		log("rendering wav form buffer:");
		log(buffer);
		
		// assuming a var named `buffer` exists and is an AudioBuffer instance


		// start a new worker 
		// we can't use Recorder directly, since it doesn't support what we're trying to do
		var worker = new Worker("js/recorderWorker.js");

		// initialize the new worker
		worker.postMessage({
		  command: 'init',
		  config: {sampleRate: 48000}
		});

		// callback for `exportWAV`
		worker.onmessage = function( e ) {
		  var blob = e.data;
		  // this is would be your WAV blob
		 
			then(blob);
		  
		};
		
		// initialize the new worker
		worker.postMessage({
			command: 'init',
			config: {
				sampleRate: 48000,
				numChannels: 2
			}
		});

		// send the channel data from our buffer to the worker
		worker.postMessage({
			command: 'record',
			buffer: [
				buffer.getChannelData(0), 
				buffer.getChannelData(1)
			]
		});

		// ask the worker for a WAV
		worker.postMessage({
		  command: 'exportWAV',
		  type: 'audio/wav'
		});
	
	
	
	};



document.addEventListener("DOMContentLoaded", function(){

	loudness_display = g("loudness_display");
	psr_display = g("psr_display");

	wavesurfer = Object.create(WaveSurfer);

	wavesurfer.init({
	
		container: '#wave',
		waveColor: 'violet',
		progressColor: 'purple'
		
	});

	wavesurfer.on('ready', function () {
	
		renderRMS(wavesurfer);
		
		g("loading_audio_file").style.display = "none";
		
		g("conducting_loudness_analysis").style.display = "block";
		
		
		
	});
	
	var display = g("rms_db_display");
	
	
	//Not needed as files are not fetched via XHR
	/*
	wavesurfer.on('loading', function(percent){
	
		g("wave_progress").value = percent;
		
		if (percent == 100){
			
			dom.remove(g("wave_progress"));
			
		}
	
	});
	*/
	
	
	
	wavesurfer.on('audioprocess', function(){
		
		var position = wavesurfer.getCurrentTime() / wavesurfer.getDuration();
		
		refreshIndicators(position);
		
	});
	
	

	g('file_input').addEventListener('change', function(evt){
	 
		var file = evt.target.files[0];
		
		wavesurfer.loadBlob(file);
		
		dom.remove(g("choose_file_dialog"));
		
		g("loading_audio_file").style.display = "block";
	
	}, false);
	
});




var getLoudnessAtPosition = function(pos){
	
	return Math.round(10 * loudness[Math.round(pos * loudness.length)]) / 10;
	
}


var getPSRAtPosition = function(pos){
	
	return Math.round(10 * psr[Math.round(pos * psr.length)]) / 10;
	
}

var refreshIndicators = function(time){
	
	loudness_display.innerHTML = getLoudnessAtPosition(time) + " LUFS";
	psr_display.innerHTML = getPSRAtPosition(time) + " LU";
	
}