window.onload = initPage; //call the initPage function as soon as the elements on the page have been loaded
let selectedUser = {};
let expenseKeys = ["saving","investment","mortage","rent","insurance","otherExpense"];	

function initPage(){	
	let form = $("#myform").show();

	/*** Get user list from dummy data  and create an user drowdown list***/
	let userList = getUserList(); 	
	if(userList.length >0 ){ 
		let userOptions = "<select id='userList'><option value = ''>Please select user from list</option>";
		$.each( userList, function( key, obj ) { 
			let fullName = obj.firstName + "  " + obj.lastName;
			userOptions += "<option value = '" +obj.ID + "' >"+ fullName +"</option>";
		});
		userOptions += "</select>"
		$("#userOptions").html(userOptions);
	}else{
		$("#userOptions").html("Oops We are having a problem getting User List. Please try again Later!");
	}	
	
	/*** Steps attributes and actions ***/
	form.steps({
		headerTag: "h3",
		bodyTag: "fieldset",
		transitionEffect: "slideLeft",
		enableCancelButton: true,
        onCanceled: function (event){
		   
		   //empty all input fields and reset selected object to empty
			selectedUser = {};
			$("#userList").val('');
			$("#myform").find("input[type=text]").val('');	
			$('#warningMsg').html('');
			
			// go to the first step
			$('#myform-t-0').click();
        },	
		onStepChanging: function (event, currentIndex, newIndex) {
		
			// allways allow previous action even if the current form is not valid!
			if (currentIndex > newIndex){
				return true;
			}
			
			// needed in some cases if the user went back (clean up)
			if (currentIndex < newIndex){
				// To remove error styles
				form.find(".body:eq(" + newIndex + ") label.error").remove();
				form.find(".body:eq(" + newIndex + ") .error").removeClass("error");
			}
			
			switch(true){
				// validate selectedUser object. Return false if it is empty!	
				case currentIndex===0 :				
					if(jQuery.isEmptyObject(selectedUser)){
						return false;
					}

					//generate html inputs based on the selectedUser's profile 
					let profileInfo = createInputs(selectedUser,'');
					if(profileInfo !== ""){ 
					   $('#profileInfo').html(profileInfo); 
					}else{
					   $('#profileInfo').html(""); 
						return false;
					}				
				break;
				
				 // generate review information based on the selectedUser object
				case currentIndex===1 :	
					if(jQuery.isEmptyObject(selectedUser)){
						return false;
					}
					
					//generate html inputs based on the selectedUser's profile 
					let reviewInfo = createInputs(selectedUser, 'review');
					if(reviewInfo !== ""){ 
					   $('#reviewInfo').html(reviewInfo); 
					}else{
					   $('#reviewInfo').html(""); 
						return false;
					}				
				break;
				
				//assuming we update user information successfully, display result on UI
				case currentIndex===2 :						
					let res = "<h4>The changes have beed made successfully. Thank you!</h4><h5>Your Yearly Expense Reports: </h5>"; 
					$("#status").html(res);		
				
					let chartData = getReportData(selectedUser,'expense');
					let chartOptions = {
						showTooltips: true,
						tooltips: {
							callbacks: {
								label: function (tooltipItem, data){
									let label = data.labels[tooltipItem.index] ;
									let value = parseInt(data.datasets[0]['data'][tooltipItem.index]); 									
									return  label + "  : $" + value ;
								}
							}
						},
						legend: {
							labels: {
								generateLabels: function(chart) {
									let data  =  chart.data;
									if (data.labels.length && data.datasets.length) {
										return data.labels.map(function(label, i) {
											return {
												text: label + ' ($' + data.datasets[0].data[i] + ')',
												initailValue: data.datasets[0].data[i],
												initailText : label,
												fillStyle: data.datasets[0].backgroundColor[i],
												hidden: isNaN(data.datasets[0].data[i]),

												// Extra data used for toggling the correct item
												index: i
											};
										});
									} else {
										return [];
									}
								}
							},
							onClick: function (event, legendItem){ 
								console.log("You click on legend Item: ",legendItem);
							}
						}

					};
					if(chartData){
						var ctx = document.getElementById('myChart').getContext('2d');
						var myChart = new Chart(ctx, {
							type: 'pie',
							data: chartData,
							options: chartOptions
						});
						$('#myChart').show();		
					}

					let chartData1 = getReportData(selectedUser, 'incomeExpense');
					if(chartData1){
						var ctx1 = document.getElementById('myChart1').getContext('2d');
						var myChart1= new Chart(ctx1, {
							type: 'pie',
							data: chartData1,
							options: chartOptions
						});
						$('#myChart1').show();		
					}									
				break;
				
				default:

			}
						
			form.validate().settings.ignore = ":disabled,:hidden";
			return form.valid();
		},
		onStepChanged: function (event, currentIndex, newIndex){
						
			//change next button text to Submit on Review Step
		 	if(currentIndex===2){  
			    $(".actions a:eq(1)").text("Submit");
			}else{
				$(".actions a:eq(1)").text("Next");
			}
			
			//hide previous button on Completed Step and disable trigger action on Tabs
		 	if(currentIndex===3){  
			    $(".actions a:eq(0)").hide();
				$(".actions a:eq(3)").hide();
				$('.done').removeClass('done').addClass('disabled');
			}		
		},
		onFinishing: function (event, currentIndex) {
			return form.valid();
		},
		onFinished: function (event, currentIndex){			
			form.submit();  		
		}
	}).validate({
		errorPlacement: function errorPlacement(error, element) {
			element.before(error); 
		},
		rules: {
			firstName: { required: true, minlength: 1 },
			lastName: {	required: true, minlength: 1 },
			phone: { required: true, minlength: 10,	phoneUS: true }, 
			email:{	required: true, email: true },
			income: {required: true, digits: true,  minlength: 1, min: 0 },
			saving: {required: true, digits: true,  minlength: 1, min: 0 },
			investment: {required: true, digits: true,  minlength: 1, min: 0 },
			mortage: {required: true, digits: true,  minlength: 1, min: 0 },
			rent: {required: true, digits: true,  minlength: 1, min: 0 },
			insurance: {required: true, digits: true,  minlength: 1, min: 0 },
			otherExpense: {required: true, digits: true,  minlength: 1, min: 0 }
		}
	});
	
	// Add US Phone Validation
	jQuery.validator.addMethod('phoneUS', function(phone_number, element) {
		phone_number = phone_number.replace(/\s+/g, ''); 
		return this.optional(element) || phone_number.length > 9 &&	phone_number.match(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/);
	}, 'Please enter a valid phone number.');
		
	/*** update selectedUser object when a user is selected from the user list***/
	$("#userList").change(function (){ 	
		let selectedID = $(this).val(); 
		
		if(selectedID === ""){
			selectedUser = {};
			return false;			
		}

		$.each( getUserList() , function( key, obj ) { 		
			if(obj.ID == selectedID){
				selectedUser = obj; 
				prefillInputs(obj);			
				return false;
			}
		});
	});	

	$('#myChart').html('').hide();
	$('#myChart1').html('').hide();	
	
}

function getReportData(selectedObj, reportType) {
	if(selectedObj === undefined ) {
		return false;
	}
	
	let labels = [];
	let data = [];
	let backgroundColor = (reportType === 'expense'?[]:['#77bfdc','#0b284e']);	
	
	Object.keys(selectedObj).map(function(key, index) {	
		if(reportType === 'expense'){
			if($.inArray( key, expenseKeys)!==-1){		
				//random a backgroud color for a slice
				let sliceColor = getRandomColor();
				
				 //avoid the same background color in backgroundColor array
				while( $.inArray( sliceColor, backgroundColor) !==-1  ){
					sliceColor = getRandomColor();				
				}
				
				//computed slice value from monthly to yearly
				let sliceValue =  parseInt( selectedObj[key] )*12;			
		
				//add a space before every uppercase character and trim off the leading spaces except ID field
				let label = (key !== "ID" ? key.replace(/([A-Z])/g, ' $1').trim():key);	
				
				//make first character to uppercase 
				label = label.replace(/\b[a-z]/g,function(f){return f.toUpperCase();});

				labels.push(label);			
				data.push(sliceValue);
				backgroundColor.push(sliceColor);
				
			}
		}else{
			if(key === 'income' || key === 'totalExpense'){
				//computed slice value from monthly to yearly
				let sliceValue = (key === 'income'?selectedObj[key]:parseInt( selectedObj[key] )*12);
				
				//add a space before every uppercase character and trim off the leading spaces except ID field
				let label = (key !== "ID" ? key.replace(/([A-Z])/g, ' $1').trim():key);	
				
				//make first character to uppercase 
				label = label.replace(/\b[a-z]/g,function(f){return f.toUpperCase();});
				
				labels.push(label);			
				data.push(sliceValue);				
			}
		}
	});
	
	if(data.length > 0 ){	
		let chartData = {
			labels :labels,
			datasets : [{
				data : data,
				backgroundColor: backgroundColor
			}]		
		};
		
		return chartData;
	}else{
		return false; //no chartData
	}	
}

function getTotalExpense(selectedObj){
	if(selectedObj == undefined ) {
		return false;
	}
	
	let total = 0;
	//sum up total expense via all expense inputs
	Object.keys(selectedObj).map(function(key, index) {
		if($.inArray( key, expenseKeys)!==-1){	
			let expense = parseInt($('#'+key).val());
			total += expense ;	
		}
	});
	if(!isNaN(total)){
		return total;
	}else{
		return false;
	}
}

function prefillInputs(selectedObj){
	if(selectedObj === undefined ) {
		return false;
	}
	
	//assigned object values onto steps 2 inputs
	Object.keys(selectedObj).map(function(key, index) {
		$('#'+key).val(selectedObj[key]);	
	});
	
	return true;
}

function onInputChange(inputObj){
	//update selectedUser object when input fields changes
	selectedUser[inputObj.id] = inputObj.value;
	
	let total = getTotalExpense(selectedUser);
	if(total!==false){
		let monthlyIncome = (parseInt($('#income').val())*0.75)/12; //assuming tax rate is 25%
		if(total > monthlyIncome) {
			let msg = "<p id='warningTotalMsg'> [WARN]: Your monthly expense $"+total+" is greater than your monthly net income $"+monthlyIncome+" (25% tax rate). Unless you have other income does not list above, please adjust your expense before you hit on the next button</p>";
					
			if($('#warningTotalMsg').length === 0) { //if $('#warningTotalMsg') doesnt exist, append this id with the warnning message
				$('#totalExpense').parent().append(msg);
			}else{ // //if $('#warningTotalMsg') exist, update the warnning message
				$('#warningTotalMsg').html(msg);
			}
		}else{
			$('#warningTotalMsg').html('');
		}
		//update totalExpense on totalExpense input Object 
		$('#totalExpense').val(total);
		
		//update totalExpense on selectUser Object 
		selectedUser['totalExpense'] = total;
		return true;
	}else{
		return false;
	}	
}

function createInputs(selectedObj, steps){
	if(selectedObj === undefined ) {
		return "";
	}
	let html = "";  //input fields to display on UI

	Object.keys(selectedObj).map(function(key, index) {
		//add a space before every uppercase character and trim off the leading spaces except ID field
		let label = (key !== "ID" && key!=="totalExpense" ? key.replace(/([A-Z])/g, ' $1').trim():key);
				
		//make first character to uppercase 
		label = label.replace(/\b[a-z]/g,function(f){return f.toUpperCase();});
			
		//append steps on input name
		let name = (steps !== ''? key + "_" + steps:key);		
				
		//add extraAttr attributes/actions based on steps. Note. ID field is readonly no matter what step it is		
		let extraAttr = ( steps==='review' || key === "ID" || key ==="totalExpense" ? "readonly":"onkeyup='onInputChange(this)'"); 	
		
		//generate html 
		let labelDisplay = label;
		if($.inArray( key, expenseKeys)!==-1){	
			 labelDisplay =  label + " Per Month";
		}else{
			if(key ==="totalExpense"){
				labelDisplay = "Total Montly Expense";
			}else if(key ==="income"){
				labelDisplay = "Income Per Year";
			}
		}
		html += "<label for='" + name + "'>" + labelDisplay + "</label>";
		html += "<input id='" + name + "' name='" + name + "' type='text' value= '"+ selectedObj[key] +"' "+extraAttr+" >";	
	});
	return html;
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getUserList(){
	//use dummy data. It could have different attributes. createInputs function will generate input fields based on the user profile
	return [
		{
			ID: "1001",
			firstName: "Vickie",
			lastName: "Chen",
			phone: "470-285-5688",
			email: "vickie_tree@hotmail.com", 
			income: 100000,
			saving: 500,
			investment: 500,
			mortage: 1000,
			rent: 0,
			insurance: 888,
			otherExpense: 600,
			totalExpense: 3488
		},
		{
			ID: "1002",
			firstName: "Joe",
			lastName: "Don",
			phone: "123-456-7898",
			email: "joedon@vickietesting.com",
			income: 80000,
			saving: 200,
			investment: 100,
			mortage: 0,
			rent: 900,
			insurance: 725,
			otherExpense: 1000,
			totalExpense: 2925
		},
		{
			ID: "1003",
			firstName: "Aaron",
			lastName: "Wood",
			phone: "111-222-3333",
			email: "araonwood@vickietesting.com",
			income: 120000,
			saving: 400,
			investment: 800,
			mortage: 1200,
			rent: 0,
			insurance: 890,
			otherExpense: 1150,
			totalExpense: 4440
		},
		{
			ID: "1004",
			firstName: "Hanna",
			lastName: "Mills",
			phone: "234-234-2345",
			email: "hannamills@vickietesting.com",
			income: 50000,
			saving: 0,
			investment: 0,
			mortage: 0,
			rent: 700,
			insurance: 700,
			otherExpense: 900,
			totalExpense: 2300
		},
		{
			ID: "1005",
			firstName: "Taylor",
			lastName: "House",
			phone: "100-200-3000",
			email: "taylorhouse@vickietesting.com",
			income: 20000,
			saving: 0,
			investment: 0,
			mortage: 0,
			rent: 500,
			insurance: 500,
			otherExpense: 500,
			totalExpense: 1500
		}			
	];	
}
