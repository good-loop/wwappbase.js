/** file: ical-count.js Author: Daniel Utility for summing ical */

var ajax;

function countCal() {
	// TODO disable the form from repeat clicks, show a spinner with "Fetching ical data from remote calendar..."
	console.log("countCal");
	var url = $('input[name=icalfeed]').val();
	var q = $('input[name=q]').val();
	if ( ! url) {
		toastr.error("Please provide an ical url");
		return;
	}
	if (ajax) {
		// can we cancel ??
	}

	var ubase = window.location.protocol==='file:'? 'https://calendar.soda.sh/static/ical' : '';
	var reqUrl = ubase+'/calendar-iCalSumTime.json';
	console.log("ajax", reqUrl);
	ajax = $.ajax({
		url: reqUrl,
		data:{
			start:$('input[name=start]').val(),
			end:$('input[name=end]').val(),
			officeOnly:$('input[name=officeOnly]').prop('checked'),
			q:q,
			icalfeed:url
		}
	}).then(countCal2);
}


$(function(){
	$('#recent-ical').on('click', '.ical-url', function(e){
		e.preventDefault();
		$("input[name=icalfeed]").val($(this).attr('data-url'));
		$("cal-name").text($(this).text());
	});
	// recent urls used?
	var icalUrls = JSON.parse(window.localStorage.getItem('ical-urls') || "[]");
	var $ul = $('#recent-ical');
	var cnt = 0;
	console.log("Recent", icalUrls);
	var shown = {};
	for(var i=icalUrls.length-1; i>=0; i--) {
		var url = icalUrls[i][0];
		if (shown[url]) {
			continue;
		}
		shown[url] = true;
		var name = icalUrls[i][1] || url;
		// TODO attr escape
		var a = $("<li><button class='ical-url btn btn-xs' data-url='"+url+"'>"+name+"</button></li>");
		$ul.append(a);
		cnt++;
		if (cnt > 6) break;
	}
	if (cnt===0) $ul.hide();
});
