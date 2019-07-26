 /*Copyright (C) 2019 Fabian Schoettler

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var rtpOffsetCalc;

// Register listeners
$( document ).ready(function() {

	
	
	
    console.log( "ready!" );
	$("#rtp_tmstp").on("change", ()=>{
		console.log("RTP value changed. should compute this");
		calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
	$("#rec_tmstp").on("change", ()=>{
		console.log("RTP value changed. should compute this");
		calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
	$("#calc_btn").on("click", ()=>{
		console.log("RTP value changed. should compute this");
		calculateDelta($("#rec_tmstp").val(), $("#rtp_tmstp").val());
	});
	
	$("#file_upload").on("click", ()=>{
		var files = document.getElementById("file_input").files[0];
		var reader = new FileReader();
		
		$("#upload_modal").addClass("active");

		
		reader.onload = function(evt) {
			//var rtpOffsetCalc = new RTPTSOffsetCalculator ( new Uint8Array(evt.target.result) );
			rtpOffsetCalc = new RTPTSOffsetCalculator ( new Uint8Array(evt.target.result) );
			renderResult( rtpOffsetCalc.getAvgMinMax() );
			$("#upload_modal").removeClass("active");

		};
		
		reader.readAsArrayBuffer( files );
	});
	
	var inputs = document.querySelectorAll( '.inputfile' );
	Array.prototype.forEach.call( inputs, function( input )
	{
		var label	 = input.nextElementSibling,
			labelVal = label.innerHTML;

		input.addEventListener( 'change', function( e )
		{
			var fileName = '';
			if( this.files && this.files.length > 1 )
				fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
			else
				fileName = e.target.value.split( '\\' ).pop();

			if( fileName ){
				label.querySelector( 'span' ).innerHTML = fileName;
				$("#file_upload").removeClass("is-hidden");
			}
			else
				label.innerHTML = labelVal;
		});
	});
	
	//initOffsetChart();
	
	addDropListener();
});




const TICKS_TILL_OVERFLOW = Math.pow(2,32);

// Calculate the difference
function calculateDelta( rec, rtp ){
	var recStr = new BigNumber(rec);
	var rtpStr = new BigNumber(rtp);
	
	
	var epochInTicks = recStr.multiply("90000");
	//console.log("Arrival timestamp [ticks] : ", epochInTicks.valueOf(), " ticks");
	
	
	var arrivalTimestamp = epochInTicks.mod(TICKS_TILL_OVERFLOW);
	//console.log("Overflowed Arrival Timestamp [ticks] : ", arrivalTimestamp.valueOf(), " ticks");
	
	var diffInTicks = arrivalTimestamp.subtract(parseInt(rtp));
	//console.log("Delta RTP - Arrival TS [ticks] : ", diffInTicks.valueOf(), " ticks");
	
	return parseFloat(diffInTicks.valueOf());
	//var diffInSecs = diffInTicks.divide("90000");
	//console.log("Delta RTP - Arrival TS [s] : ", diffInSecs.valueOf(), " s");
	
	//$("#delta").text(diffInSecs.valueOf());
	
}

function calculateDeltaInTicks( rec, rtp){
	var recStr = new BigNumber(rec);
	var rtpStr = new BigNumber(rtp);
	
	
	var epochInTicks = recStr.multiply( CLOCK_SPEED_HZ.toString() );
	
	var arrivalTimestampTicks = epochInTicks.mod( TICKS_TILL_OVERFLOW );
	
	var diffInTicks = arrivalTimestampTicks.subtract( rtpStr );
	
	return parseFloat( diffInTicks.valueOf() );
	
}


function addDropListener(){
  var $form = $("#upload_container");
  $form.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('dragover dragenter', function() {
    $form.addClass('is-dragover');
  })
  .on('dragleave dragend drop', function() {
    $form.removeClass('is-dragover');
  })
  .on('drop', function(e) {
    droppedFiles = e.originalEvent.dataTransfer.files;
	//console.log(droppedFiles[0].name);
	$("#upload_msg").text(droppedFiles[0].name);
	var reader = new FileReader();
	
	$("#upload_modal").addClass("active");
	
	reader.onload = function(evt) {
		$("#upload_modal").removeClass("active");
		//var timestamps = extractTimestamps( new Uint8Array(evt.target.result) );
		//calculateDelta( timestamps.merged_ts_str, timestamps.rtp_ts_dec );
		var rtpOffsetCalc = new RTPTSOffsetCalculator ( new Uint8Array(evt.target.result) );
		renderResult( rtpOffsetCalc.getAvgMinMax() );
		
	};
	
	reader.readAsArrayBuffer(droppedFiles[0]);
  });
}

function renderResult( result ){
	function round ( num ){
		const DIGIT_TO_ROUND = 1000000000;
		return Math.round(num * DIGIT_TO_ROUND) / DIGIT_TO_ROUND;
	}
	
	var rounded_avg = round( result.avgDelta_s );
	var rounded_min = round( result.minDelta_s );
	var rounded_max = round( result.maxDelta_s );
	
	
	$("#avg_offset").find("span").text( rounded_avg );
	$("#min_offset").find("span").text( rounded_min );
	$("#max_offset").find("span").text( rounded_max );
}

var globalResult;

function extractTimestamps( result ){
	
	globalResult =result;

	console.log(" Packet : ", result);

	const SECONDS_INDEX_LOW = 24;
	const SECONDS_INDEX_HIGH= 27;
	var seconds = result.slice( SECONDS_INDEX_LOW, SECONDS_INDEX_HIGH+1 );
	var seconds_dec = byteArrayTo32Int( seconds );
	
	const NANO_INDEX_LOW = 28;
	const NANO_INDEX_HIGH = 31; 
	var nanos = result.slice( NANO_INDEX_LOW, NANO_INDEX_HIGH+1);
	var nanos_dec = byteArrayTo32Int( nanos );
	
	const RTP_TS_INDEX_LOW = 86;
	const RTP_TS_INDEX_HIGH= 89;
	var rtp_ts = result.slice( RTP_TS_INDEX_LOW, RTP_TS_INDEX_HIGH+1 );
	var rtp_ts_dec = byteArrayTo32Int( rtp_ts.reverse() );
	
	var merged_ts_str = mergeTS( seconds_dec, nanos_dec );
	
	var output = { seconds_dec, nanos_dec, rtp_ts_dec, merged_ts_str }
	
	$("#rec_tmstp").val( merged_ts_str );
	$("#rtp_tmstp").val( rtp_ts_dec );
	
	console.table(output);
	return output;
}

function mergeTS (seconds, nanos){
	var s_str = seconds.toString();
	var n_str = nanos.toString();
	var output = s_str + "." + n_str;
	return output
}

function byteArrayTo32Int( byteArray ){
	if( byteArray.length != 4){
		console.error("BYTE ARRAY - Wrong length!");
	}
	else{
		return byteArray[0] + byteArray[1]* 256 + byteArray[2]*Math.pow(256,2) + byteArray[3]*Math.pow(256,3);
	}
}

function byteArrayTo16Int( byteArray ){
	if( byteArray.length != 2){
		console.error("BYTE ARRAY - Wrong length!");
	}
	else{
		return byteArray[0] + byteArray[1]* 256;
	}
}

// PCAP PACKET HEADER + GLOBAL HEADER = 40Bytes 
//ETHERNET
// IP

// ETHERNET + IP + UDP + RTP = 42Bytes
// RTP Unwichtige Byte = 4 Bytes
// --> RTP Timestamp at lower index: 86 - einschl.89












