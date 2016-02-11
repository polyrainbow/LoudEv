var wavesurfer = null;
var combined;
var loudness_canvas = null;
var psr_canvas;

var loudness = null;
var psr = null;

var loudness_display = null;
var psr_display = null;


function renderRMS(wavesurfer){

	loudness_canvas = dom.make("canvas", "loudness_canvas", "", g("loudness_div"));
	loudness_canvas.style.width = "100%";
	loudness_canvas.style.height = "150px";
	
	psr_canvas = dom.make("canvas", "psr_canvas", "", g("psr_div"));
	psr_canvas.style.width = "100%";
	psr_canvas.style.height = "150px";

	var canvas_width = loudness_canvas.getBoundingClientRect().width * 2;
	var canvas_height = loudness_canvas.getBoundingClientRect().height * 2;

	// we will also need the untouched channels for PSR calculation
	var leftChannel_untouched = wavesurfer.backend.buffer.getChannelData(0);	
	var rightChannel_untouched = wavesurfer.backend.buffer.getChannelData(1);	
	
	//get a resampled audioBuffer
	var lengthInSeconds = leftChannel_untouched.length / wavesurfer.backend.ac.sampleRate;
	var targetSampleRate = 44100;
	var OAC = new OfflineAudioContext(2, lengthInSeconds * targetSampleRate, targetSampleRate);
	var source = OAC.createBufferSource();
	source.buffer = wavesurfer.backend.buffer;

	
	/*
		The following filter coefficients are by klangfreund
		https://github.com/klangfreund/LUFSMeter/blob/master/projects/LUFSMeter/Source/Ebu128LoudnessMeter.cpp
	*/
	
	var ff1 = new Float64Array(3);
	ff1[0] = 1.53512485958697;  // b0
    ff1[1] = -2.69169618940638; // b1
    ff1[2] = 1.19839281085285;  // b2
    
	var fb1 = new Float64Array(3);
	fb1[0] = 1;
	fb1[1] = -1.69065929318241; // a1
    fb1[2] = 0.73248077421585; // a2
    
	var highshelf_filter = OAC.createIIRFilter(ff1, fb1);
	
	var ff2 = new Float64Array(3);
	ff2[0] = 1.0;               // b0
    ff2[1] = -2.0;              // b1
    ff2[2] = 1.0;               // b2
	
	var fb2 = new Float64Array(3);
	fb2[0] = 1;
	fb2[1] = -1.99004745483398; // a1
    fb2[2] = 0.99007225036621; // a2
	
	var highpass_filter = OAC.createIIRFilter(ff2, fb2);
	
	var gain = OAC.createGain();
	gain.gain.value = 0.5;
	
	source.connect(gain);
	gain.connect(highshelf_filter);
	highshelf_filter.connect(highpass_filter);
	highpass_filter.connect(OAC.destination);
	
	
	source.start();
  
	OAC.startRendering().then(function(renderedBuffer) {
	
		console.log('Rendering completed successfully');

		var leftChannel_filtered = renderedBuffer.getChannelData(0);
		var rightChannel_filtered = renderedBuffer.getChannelData(1);
		
		var myWorker = new Worker("js/loudness-worker.js");
		myWorker.postMessage({
			filtered_buffers: [leftChannel_filtered, rightChannel_filtered],
			untouched_buffers: [leftChannel_untouched, rightChannel_untouched],
			width: canvas_width}
		);
		
		console.log('Data to analyse posted to worker');

		myWorker.onmessage = function(e) {
			
			var data = e.data;
			
			if (data.type == "finished"){
				
				console.log('Message received from worker');
				console.log(data);
				
				g("conducting_loudness_analysis").style.display = "none";
				
				loudness = data.loudness;
				psr = data.psr;
				
				drawLoudnessDiagram(loudness);
				drawPSRDiagram(psr);
				
				wavesurfer.play();
				
			}
			
			if (data.type == "progress"){
				
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
		
		if (loudness[i] < 5){
			ctx.strokeStyle = '#000000';  //black
		}
		
		else if (loudness[i] < 6.5){
			ctx.strokeStyle = '#770000';  //dark red
		}
		
		else if (loudness[i] < 7.25){
			ctx.strokeStyle = '#ff0000';  //red
		}
		
		else if (loudness[i] < 8){
			ctx.strokeStyle = '#ff4500';  //orangered
		}
		
		else if (loudness[i] < 8.75){
			ctx.strokeStyle = '#ffa500';  //orange
		}
		
		else if (loudness[i] < 9.5){
			ctx.strokeStyle = '#ffc500';  //brighter orange
		}
		
		else if (loudness[i] < 10.5){
			ctx.strokeStyle = '#ffff00';  //yellow
		}
		
		else if (loudness[i] < 12){
			ctx.strokeStyle = '#b4ff00';  //yellow green
		}
		
		else {
			ctx.strokeStyle = '#00ff00';  //lime green
		}
		
		//typical values in music are 20 to 3 LU
		var lineHeight = canvas_height * ((loudness[i] - 2) / 17);
	
		ctx.moveTo(i, canvas_height);
		ctx.lineTo(i, canvas_height - lineHeight);
		ctx.stroke();
	
	}


}


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
	
	return Math.round(10 * (loudness[Math.round(pos * loudness.length)])) / 10;
	
}


var getPSRAtPosition = function(pos){
	
	return Math.round(10 * psr[Math.round(pos * psr.length)]) / 10;
	
}

var refreshIndicators = function(time){
	
	var loudness = getLoudnessAtPosition(time).toString();
	if (loudness.indexOf(".") == -1) loudness = loudness + ".0";
	
	var psr = getPSRAtPosition(time).toString();
	if (psr.indexOf(".") == -1) psr = psr + ".0";
	
	loudness_display.innerHTML = loudness + " LUFS";
	psr_display.innerHTML = psr + " LU";
	
}