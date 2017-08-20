onmessage = function(e) {

	var buffers = e.data.buffers;
	var channelCount = e.data.buffers.length;
	var gatingBlockLength = 0.4;
	var channelWeightings = [1, 1];
	var absoluteGatingThreshold = -70; //LKFS
	var duration = e.data.duration; //seconds
	//var sampleRate = e.data.sampleRate;
	var overlap = 0.25;
	var step = 1 - overlap;
	var numberOfGatingBlocks = Math.floor((duration - gatingBlockLength) / (gatingBlockLength * step));
	console.log("numberOfGatingBlocks", numberOfGatingBlocks)
	var gatingBlockLoudnesses = new Array(numberOfGatingBlocks);
	var channelGatingBlockMS = new Array(channelCount);
	for (var c = 0; c< channelCount; c++){
		channelGatingBlockMS[c] = new Array(numberOfGatingBlocks);
	}
	var gatingBlockMSesAboveAbsThreshold = [];

	function getSampleIndexAtTime(time, buffers, duration){
		var samplesPerChannel = buffers[0].length;
		var relativePosition = time / duration;
		return Math.floor(relativePosition * samplesPerChannel);
	}

	function getLoudnessOfGatingBlockMSes(MSes){

		var sum = 0;
		for (var c = 0; c < channelCount; c++){
			sum += channelWeightings[c] * MSes[c];
		}

		return -0.691 + (10 * Math.log10(sum));

	}

	// get MSes of all channel blocks
	for (var b = 0; b < numberOfGatingBlocks; b++){
		var startSampleIndex = getSampleIndexAtTime(gatingBlockLength * b * step, buffers, duration);
		var endSampleIndex = getSampleIndexAtTime(gatingBlockLength * (b * step + 1), buffers, duration);
		var numberOfSamplesInBlock = endSampleIndex - startSampleIndex;

		for (var c = 0; c < channelCount; c++){
			var sum = 0;
			for (var s = startSampleIndex; s < endSampleIndex; s++){
				sum += buffers[c][s];
			}
			//channelGatingBlockMS[c][b] = (1 / gatingBlockLength) * sum;
			channelGatingBlockMS[c][b] = (1 / numberOfSamplesInBlock) * sum;
		}
	}


	//get gating block loudness values and get blocks above absolute threshold
	for (var b = 0; b < numberOfGatingBlocks; b++){
		gatingBlockLoudnesses[b] = getLoudnessOfGatingBlockMSes([
			channelGatingBlockMS[0][b],
			channelGatingBlockMS[1][b],
		]);

		if (gatingBlockLoudnesses[b] > absoluteGatingThreshold){
			gatingBlockMSesAboveAbsThreshold.push([
				channelGatingBlockMS[0][b],
				channelGatingBlockMS[1][b]
			]); //MS values for both channels for this block

			//optimize!
		}

	}

	var numberOfBlocksAboveAbsThreshold = gatingBlockMSesAboveAbsThreshold.length;

	//compute relative threshold
	var sum = 0;
	for (var c = 0; c < channelCount; c++){

		var channelSum = 0;
		for (var b = 0; b < numberOfBlocksAboveAbsThreshold; b++){
			channelSum += gatingBlockMSesAboveAbsThreshold[b][c];
		}

		sum += channelWeightings[c] * (1 / numberOfBlocksAboveAbsThreshold) * channelSum;
	}
	var relativeThreshold = -0.691 + (10 * Math.log10(sum)) - 10; //LKFS

	var gatingBlockMSesAboveBothThresholds = gatingBlockMSesAboveAbsThreshold
	.filter(MSes => {
		return (getLoudnessOfGatingBlockMSes(MSes) > relativeThreshold);
	});

	//compute loudness of gating blocks above both thresholds
	var sum = 0;
	for (var c = 0; c < channelCount; c++){
		var channelSum = 0;
		for (var b = 0; b < gatingBlockMSesAboveBothThresholds.length; b++){
			channelSum += gatingBlockMSesAboveBothThresholds[b][c];
		}

		sum += channelWeightings[c] * (1 / gatingBlockMSesAboveBothThresholds.length * channelSum);

	}

	var gatedLoudness = -0.691 + (10 * Math.log10(sum));

	var response = {
		type: "finished",
		integratedLoudness: gatedLoudness
	}

	postMessage(response);

}
