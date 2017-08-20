var ASSESS = (function(){

	var emojis = {
		scale: ['😭', '😢', '☹️', '🙁', '😕', '😐', '😊', '😃'],
		good: '😊',
		bad: '☹️'
	};

	var my = {};

	my.maxTruePeak = (tp) => {
		if (tp <= -1 && tp >= -5){
			return emojis.good;
		} else {
			return emojis.bad;
		}
	};

	my.minPSR = (minPSR) => {
		if (minPSR >= 8){
			return emojis.good;
		} else {
			return emojis.bad;
		}
	};

	my.integratedLoudness = (il) => {
		if (il <= -12 && il >= -18){
			return emojis.good;
		} else {
			return emojis.bad;
		}
	};


	my.getPSRColor = function(psr_value){
		var color;

		if (psr_value < 5){
			color = '#000000';  //black
		} else if (psr_value < 6){
			color = '#770000';  //dark red
		} else if (psr_value < 7){
			color = '#ff0000';  //red
		} else if (psr_value < 7.5){
			color = '#ff4500';  //orangered
		} else if (psr_value < 8){
			color = '#ffa500';  //orange
		} else if (psr_value < 8.5){
			color = '#ffc500';  //brighter orange
		} else if (psr_value < 9.5){
			color = '#ffff00';  //yellow
		} else if (psr_value < 11){
			color = '#b4ff00';  //yellow green
		} else {
			color = '#00ff00';  //lime green
		}

		return color;

	}


	my.PLR = function(plr_value){
		var assessment;

		if (plr_value < 6){
			assessment = {
				emoji: emojis.scale[0],
				title: "No, just no!",
				description: "You have mastered your music far too loud. Pull back your mastering compressor to get better playback results on online streaming platforms like YouTube and Spotify."
			};
		} else if (plr_value < 7){
			assessment = {
				emoji: emojis.scale[1],
				title: "No, just no!",
				description: "You have mastered your music far too loud. Pull back your mastering compressor to get better playback results on online streaming platforms like YouTube and Spotify."
			};
		} else if (plr_value < 7.5){
			assessment = {
				emoji: emojis.scale[2],
				title: "No, just no!",
				description: "You have mastered your music too loud. Pull back your mastering compressor to get better playback results on online streaming platforms like YouTube and Spotify."
			};
		} else if (plr_value < 8){
			assessment = {
				emoji: emojis.scale[3],
				title: "Well... almost!",
				description: "You have mastered your music a bit too loud. You can get better playback results on online streaming platforms like YouTube and Spotify, when you push the master compressor a bit less hard."
			};
		} else if (plr_value < 8.5){
			assessment = {
				emoji: emojis.scale[4],
				title: "Well... almost!",
				description: "You have mastered your music a bit too loud. You can get better playback results on online streaming platforms like YouTube and Spotify, when you push the master compressor a bit less hard."
			};
		} else if (plr_value < 9.5){
			assessment = {
				emoji: emojis.scale[5],
				title: "OK!",
				description: "Your track has some dynamic range, which is good. A bit more wouldn't hurt."
			};
		} else if (plr_value < 11){
			assessment = {
				emoji: emojis.scale[6],
				title: "Perfect!",
				description: "Your track has the right amount of dynamic range, which is good. That way, you can get decent playback results on online streaming platforms like YouTube and Spotify."
			};
		} else {
			assessment = {
				emoji: emojis.scale[7],
				title: "Good!",
				description: "Your track has a lot of dynamic range, which is good. That way, you can get decent playback results on online streaming platforms like YouTube and Spotify."
			};
		}

		return assessment;

	}

	return my;

})();
