/*
Copyright 2014 Sebastian Zimmer

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/


var dom = (function() {

	var my = {};

	my.getSelectedRadioIndex = function (radios){

		if (typeof radios == "string"){
		
			radios = document.getElementsByName(radios);
			
		}		

		for (var r = 0; r < radios.length; r++){
		
			if (radios[r].checked === true){
			
				return r;
			
			}
		
		}
		
		return 0;

	};
	
	
	my.getSelectedRadioValue = function (radios){
		
		if (typeof radios == "string"){
		
			radios = document.getElementsByName(radios);
			
		}
		
		return radios[my.getSelectedRadioIndex(radios)].value;
	
	};
	
	
	my.makeRadios = function(parent, array, name, id_prefix, title_key, value_key, start_value, on_change, hovers){
		var radios = [];
		var radio;
		var span;
		
		for (var f = 0; f < array.length; f++){
			
			if (hovers){
				var hover = hovers[f];
			}
			
			else {
				hover = undefined;
			}
			
			radio = my.makeRadio(
				parent, array[f][value_key], array[f][title_key], id_prefix + f, name, on_change, hover
			);
		
			if (f === start_value || start_value == array[f][value_key]){
				radio.checked = true;
			}
			
			my.br(parent);
			
			radios.push(radio);
			
		}
		
		return radios;
	
	};
	
	
	my.makeRadio = function(parent, value, title, id, name, on_click, hover){
	
		var radio = my.input(parent, id, "", name, "radio", value);
		if (hover){
			radio.title = hover;
		}
		
		var span = my.span(parent, "", "", " " + title);
		if (hover){
			span.title = hover;
		}
		
		span.addEventListener("click", function (radio) {
			return function(){
				radio.checked = true;
			}
		}(radio), false);

		if (on_click) {
			radio.addEventListener("click", function (event) {
			
				event.stopPropagation();
				on_click(value);
	
			}, false);
			
			span.addEventListener("click", function (event) {
			
				event.stopPropagation();
				on_click(value);

			}, false);
		}	
	
		return radio;
	
	};
	
	
	my.removeOptions = function (selectbox){
		
		var i;
		
		for (i = selectbox.options.length - 1; i >= 0; i--){
			selectbox.remove(i);
		}
		
	};
	
	
	my.setRadiosByValue = function(radios, value){
	
		for (var r=0; r< radios.length; r++){
		
			if (radios[r].value == value){
			
				radios[r].checked = true;
				return;
				
			}
		
		}
	
		console.error("dom.setRadioByValue: Value " + value + " not available in radios!");
	
	};
	

	my.setRadioIndex = function (radios, index){

		if (typeof index != "number"){
			console.error("dom.setRadioIndex: index is not of type number but " + typeof index);
			return;
		}
	
		radios[index].checked = true;

	};
	
	
	my.getOptionValuesOfSelect = function(select){

		var option_values = [];

		forEach(select.options, function(option){
			
			option_values.push(option.value);
		
		});

		return option_values;

	};


	my.br = function(parent){
	
		var br = my.newElement("br","","",parent);
		return br;
	
	};
	
	
	my.img = function(parent,id,className,src){
	
		var img = my.newElement("img",id,className,parent);
		img.src = src;
		
		return img;	
	
	};
	
	
	my.div = function(parent,id,className,innerHTML){
	
		var div = my.newElement("div",id,className,parent,innerHTML);
		
		return div;	
	
	};
	
	
	my.span = function(parent,id,className,innerHTML){
	
		var span = my.newElement("span",id,className,parent,innerHTML);
		
		return span;	
	
	};
	
	
	my.spanBR = function(parent, id, className, innerHTML){
	
		var span = my.span(parent,id,className,innerHTML);
		
		my.br(parent);
		
		return span;
	
	};
	
	
	my.p = function(parent, innerHTML, id, className){
	
		var p = my.newElement("p",id,className,parent,innerHTML);
		
		return p;	
	
	};
	
	
	my.a = function(parent, id, className, href, innerHTML, onclick){
	
		var a = my.newElement("a",id,className,parent,innerHTML);
		
		if (href){
			a.href = href;
		}
		
		if (typeof onclick != "undefined"){
			a.addEventListener("click", onclick);
		}
		
		return a;
	
	};
	
	
	my.link = function(parent, id, className, innerHTML, onclick){
	
		var a = my.a(parent, id, className, undefined, innerHTML, onclick);
	
		return a;
	
	};
	
	
	my.h1 = function(parent, innerHTML){
	
		var h1 = my.newElement("h1","","",parent, innerHTML);
		return h1;
	
	};

	
	my.h2 = function(parent, innerHTML){
	
		var h2 = my.newElement("h2","","",parent, innerHTML);
		return h2;
	
	};
	
	
	my.h3 = function(parent, innerHTML){
	
		var h3 = my.newElement("h3","","",parent, innerHTML);
		return h3;
	
	};
	
	
	my.h5 = function(parent, innerHTML){
	
		var h5 = my.newElement("h5","","",parent, innerHTML);
		return h5;
	
	};
	
	
	my.input = function(parent, id, className, name, type, value){
	
		var input = my.newElement("input",id,className,parent);
		input.type = type;
		input.name = name;
		
		if (typeof value != "undefined"){
			input.value = value;
		}
		
		return input;
	
	};
	
	
	my.checkbox = function(parent, id, className, name, checked){
	
		var input = my.input(parent, id, className, name, "checkbox");
		input.checked = checked;
		
		return input;
	
	};
	
	
	my.textInput = function(parent, id, className, name, value){
	
		return my.input(parent, id, className, name, "text", value);
	
	};
	
	
	my.button = function(parent, value, onclick){
	
		var input = my.input(parent, "", "", "", "button", value);
		
		input.addEventListener("click", onclick, false);
	
		return input;
	
	};
	

	my.textarea = function (parent, id, className, rows, cols, value){
		
		var textarea = my.make("textarea", id, className, parent);
		textarea.rows = rows;
		textarea.cols = cols;
		textarea.value = value;
		return textarea;

	};


	my.newElement = function (element_tag,element_id,element_class,parent_to_append_to,innerHTML){

		var element = document.createElement(element_tag);
		
		if (element_id !== ""){
			element.id = element_id;
		}
		
		if (element_class !== ""){
			element.className = element_class;
		}
		
		if (typeof parent_to_append_to != "undefined"){
			parent_to_append_to.appendChild(element);
		}
		
		if (innerHTML){
		
			element.innerHTML = innerHTML;
		
		}
		
		return element;
	};
	
	
	my.make = my.newElement;


	my.remove = function (elem){
	
		if (typeof elem == "string"){
			var id = elem;
			elem = g(id);
		}
		
		if (typeof elem == "undefined"){
			
			console.error("dom.remove: Element undefined. id = " + id);
			return undefined;
			
		}

		return elem.parentNode.removeChild(elem);
		
	};
	
	
	my.hideAllChildren = function(elem){
		
		var children = elem.children;
		forEach(children, my.hideElement);
		
	};
	
	
	my.showAllChildren = function(elem){
		
		var children = elem.children;
	
		for (var c=0; c<children.length; c++){
	
			children[c].style.display = "";
	
		}
		
	};
	
	
	my.hideElement = function(elem){
		elem.style.display = "none";
	};
	
	
	my.hide = my.hideElement;


	my.unhideElement = function(elem){
	
		elem.style.display = "";
	
	};
	
	
	my.scrollTop = function(element){
	
		element.scrollTop = 0;
	
	};
	
	
	my.setSelectOptions = function(select, options, text_key, value_key, first_option_empty){
		var text;
		
		my.removeOptions(select);
		
		if (first_option_empty === true){
		
			var NewOption = new Option("", 0, false, true);
			select.options[select.options.length] = NewOption;
		
		}
		
		forEach(options, function(option, index){
			var value;
			
			if (typeof text_key != "undefined"){
				text = option[text_key];
			}
			
			else {
				text = option;
			}
			
			
			if (text_key == "take_index"){
				text = index;
			}
			
			if (typeof value_key != "undefined"){
				value = option[value_key];
			}
			
			else {
				value = option;
			}	
			
			
			if (value_key == "take_index"){
				value = index;
			}
			

			my.appendOption(select, text, value);
			
		});
	
		select.selectedIndex = 0;
	
	};
	
	
	my.setSelectValue = function(select, value){
		
		for (var i=0, len=select.options.length; i<len; i++){
			
			if (select.options[i].value == value){
				
				select.selectedIndex = i;
				return;
				
			}
			
		}
		
		//if value isn't available, set no selectedIndex
		select.selectedIndex = -1;
		
	}
	
	
	my.appendOption = function(select, text, value){
	
		var NewOption = new Option(text, value, false, true);
		select.options[select.options.length] = NewOption;
	
	};
	
	
	my.appendHTMLContent = function(parent, content){
	
		if (typeof content == "string"){
			
			var span = my.span(parent, "", "", "");
			span.innerHTML += content;
			
		}
		
		if (typeof content == "object" &&
		Object.prototype.toString.call( content ) !== '[object Array]'){
		
			parent.appendChild(content);
			
		}

		if( Object.prototype.toString.call( content ) === '[object Array]' ) {
	
			forEach(content, function(DOM_element){
				my.appendHTMLContent(parent, DOM_element);
			});
		
		}
	
	};
	
	
	my.getByName = function(name){
	
		return document.getElementsByName(name);
	
	};
	
	
	return my;
	
})();

