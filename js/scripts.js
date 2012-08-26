var locations_array = [];
var map = {};
var markersArray = [];
var infoWindowArray = [];
var infoWindow = {};
var online = 'no';
var mapCenter = {};
var geocoder = {};

$(document).ready(function () {
  initialize();
});



function initialize() {
	var latlng = new google.maps.LatLng(40.645532, -74.0123851);
	var myOptions = {
		zoom: 13,
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	infoWindow = new google.maps.InfoWindow({});
	geocoder = new google.maps.Geocoder();
}

function toggleOptions(options) {
	$(options).toggle();
}

function getZip(results, status) {
	if (status == google.maps.GeocoderStatus.OK) {
		mapCenter 	= results[0].geometry.location;
		lat 		= results[0].geometry.location.lat();
		lng 		= results[0].geometry.location.lng();
		var zip_found = 0;
		
		$.each(results[0].address_components, function(component_index, component) {
			$.each(component.types, function(type_index, type) {
				if (type == 'postal_code') {
					zip_found = 1;
					zip = component.long_name;
				}
			});
		});
		
		if (!zip_found) {
			var latlng = new google.maps.LatLng(lat, lng);
			geocoder.geocode({'latLng': latlng} , function (results, status) {	getZip(results, status); 	});
		} else {
			getRatesAsync(zip);
		}
		
	} else {
		alert("Geocode was not successful for the following reason: " + status);
	}
}

function getRates() {
	var zip = $('#zip').val();
		
	if (method == 'agents') {
		online = 'no';
	} else if (method == 'websites') {
		online = 'yes';
	}
	
	if (online == 'yes') {
		$('#method_websites').addClass('selected');
		$('#method_agents').removeClass('selected');
		getRatesAsync(zip);
	} else {
		$('#method_agents').addClass('selected');
		$('#method_websites').removeClass('selected');
		
		geocoder.geocode({address: zip} , function (results, status) {	getZip(results, status); 	});
	}
}

function getRatesAsync(zip) {
	data = 'zip=' + zip + '&amount=' + $('#amount').val() + '&order=' + $('#order').val() + '&online=' + online;
	$('#results').html('');
	
	var url = 'services_fake.php';
	if (zip == '11220') url = 'services_real.php';
	
	$.ajax({
		url: url,
		cache: false,
		data: data,
		success: function(response){
			responses = jQuery.parseJSON(response);
			if (zip == '11220') renderReal(responses);
			else renderFake(responses);
			
			$('#search_footer').show();
		}
	});
}

function renderReal(responses) {
	counter = 0;
	$.each(responses['prices'], function(provider, value) {
		console.log(value);
		counter++;
		provider 	= providers[provider];
		service 	= responses['services'][value['service']];
		
		var newResult = $('#result_template').clone();
		newResult.attr('id', 'result_' + counter).css('display', 'block');
		newResult.find('.total').html(number_format(value.total));
		newResult.find('.title').html(provider.title);
		newResult.find('.rank').html(counter);
		newResult.find('.fee').html(number_format(value.fee, 2));
		newResult.find('.rate').html(number_format(value.rate, 3));
		newResult.find('.logo_src').attr('src', 'images/' + provider.logo);
		
		if (online == 'yes') {
			newResult.find('.logo_a').attr('href', provider.url);
			newResult.find('.logo_a').attr('target', '_new');
		} else {
			newResult.find('.logo_src').click(function() 	{		showLocations(counter);		});
			newResult.find('.total').click(function() 		{		showLocations(counter);		});
			newResult.find('.rank').click(function() 		{		showLocations(counter);		});			
		}
		
		var options = 0;
		
		var options_id = 'options_' + counter;
		newResult.find('.options_template').addClass(options_id);
		newResult.find('.options_template').removeClass('options_template');
		newResult.find('.show').click(function() {		toggleOptions('.' + options_id);		});
		newResult.find('.hide').click(function() {		toggleOptions('.' + options_id);		});
		
		var newOptions = $('#options_template').clone().attr('id', options_id);
		newOptions.addClass(options_id);
		
		$.each(value['options'], function(service, option) {
			options++;
			service = responses['services'][service];
			
			var option_id = 'option_' + counter + '_' + options;
			
			var newOption = $('#option_template').clone().attr('id', option_id).css('display', 'block');
			newOption.find('.option_label').html(service.title);
			newOption.find('.option_rate').html(number_format(option.rate, 3));
			newOption.find('.option_fee').html(number_format(option.fee, 2));
			newOption.find('.option_total').html(number_format(option.total));
	
			newOptions.append(newOption);
		});
		newResult.find('.options_count').html(options);
		newOptions.append('<div class="clear"></div>');
		newResult.append(newOptions);
		
		if (options == 1) {
			newResult.find('.show').hide();
		}
		
		$('#results').append(newResult);
		
		locations_array[counter] = value['locations'];
	});
	
	if (online == 'no') {
		$('#map_canvas').show();
		initialize();
		map.setCenter(mapCenter);
	} else {
		$('#map_canvas').hide();
	}
}

function renderFake(responses) {
	$.each(responses, function(result_index, value) {
		var newResult = $('#result_template').clone();
		newResult.attr('id', 'result_' + result_index).css('display', 'block');
		newResult.find('.total').html(value.total);
		newResult.find('.title').html(value.provider.title);
		newResult.find('.rank').html(result_index + 1);
		newResult.find('.fee').html(value.fee);
		newResult.find('.rate').html(value.rate);
		newResult.find('.logo_src').attr('src', 'images/' + value.provider.logo);
		
		if (online == 'yes') {
			newResult.find('.logo_a').attr('href', value.provider.url);
			newResult.find('.logo_a').attr('target', '_new');
		} else {
			newResult.find('.logo_src').click(function() 	{		showLocations(result_index);		});
			newResult.find('.total').click(function() 		{		showLocations(result_index);		});
			newResult.find('.rank').click(function() 		{		showLocations(result_index);		});			
		}
		
		var options = 0;
		
		var options_id = 'options_' + result_index;
		newResult.find('.options_template').addClass(options_id);
		newResult.find('.options_template').removeClass('options_template');
		newResult.find('.show').click(function() {		toggleOptions('.' + options_id);		});
		newResult.find('.hide').click(function() {		toggleOptions('.' + options_id);		});
		
		var newOptions = $('#options_template').clone().attr('id', options_id);
		newOptions.addClass(options_id);
		
		$.each(value['options'], function(option_index, option) {
			options++;
			var option_id = 'option_' + result_index + '_' + option_index;
			
			var newOption = $('#option_template').clone().attr('id', option_id).css('display', 'block');
			newOption.find('.option_label').html(option.speed);
			newOption.find('.option_rate').html(option.rate);
			newOption.find('.option_fee').html(option.fee);
			newOption.find('.option_total').html(option.total);
	
			newOptions.append(newOption);
		});
		newResult.find('.options_count').html(options);
		newOptions.append('<div class="clear"></div>');
		newResult.append(newOptions);
		
		if (options == 1) {
			newResult.find('.show').hide();
		}
		
		$('#results').append(newResult);
		
		locations_array[result_index] = value['locations'];
	});
	
	if (online == 'no') {
		$('#map_canvas').show();
		initialize();
		map.setCenter(mapCenter);
	} else {
		$('#map_canvas').hide();
	}
}

function showLocations(index) {
	clearMarkers();
	
	$.each(locations_array[index], function(location_index, location) {
		var myLatlng = new google.maps.LatLng(
			location.lat,
			location.lon
		);
		
		var marker = new google.maps.Marker({
			position: myLatlng, 
			map: map, 
			title: location.title
		});
		
		markersArray.push(marker);
		google.maps.event.addListener(marker, 'click', function() {		
			infoWindow.setContent(infoWindowArray[location.code]);
			infoWindow.open(map, marker);
		});
		
		infoWindowArray[location.code] = '<b>' + location.title + '</b><br/>' + location.address  + '<br/>' + location.city  + ', ' + location.state + ' ' + location.zip + '<br/>' + location.phone;
	});
	
}

function clearMarkers() {
  if (markersArray) {
    for (i in markersArray) {
      markersArray[i].setMap(null);
    }
  }
}

function number_format(number, decimals, dec_point, thousands_sep) {
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}