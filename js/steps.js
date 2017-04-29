window.onload = initPage; //call the initPage function as soon as the elements on the page have been loaded

function initPage(){	
	let form = $("#myform").show();
	let selectedUser = {};
	
	/*** Get user list from dummy data  and create user list selection ***/
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
		$("#userOptions").html("Oops We are having a problem getting User List!");
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
			$("#myform").find("input[type=text]").val("");	
			
			// go to the first step
			$('#myform-t-0').click();
        },	
		onStepChanging: function (event, currentIndex, newIndex) {
		
			// Allways allow previous action even if the current form is not valid!
			if (currentIndex > newIndex){
				return true;
			}
			
			// Needed in some cases if the user went back (clean up)
			if (currentIndex < newIndex){
				// To remove error styles
				form.find(".body:eq(" + newIndex + ") label.error").remove();
				form.find(".body:eq(" + newIndex + ") .error").removeClass("error");
			}
			
			// Validate selectedUser object. Return false if it is empty!
			if(currentIndex===0){ 
				if(jQuery.isEmptyObject(selectedUser)){
					return false;
				} 
			}
			
			//generate review information based on the selectedUser object
			if(currentIndex===1){  
				let reviewInfo = "";
				Object.keys(selectedUser).map(function(key, index) {
					//add a space before every uppercase character and trim off the leading spaces except ID field
			        let label = (key!=="ID"?key.replace(/([A-Z])/g, ' $1').trim():key);
					
					//make first character to uppercase 
					label = label.replace(/\b[a-z]/g,function(f){return f.toUpperCase();});
				   
					reviewInfo += "<label for='" + key + "'>" + label + "</label>";
					reviewInfo += "<input name='" + key + "_r' type='text' value= '"+ selectedUser[key] +"' readonly>";	
				});
				
				if(reviewInfo !== ""){ 
				   $('#reviewInfo').html(reviewInfo); 
				}else{
				   $('#reviewInfo').html(""); 
					return false;
				}					
			}
			
			if(currentIndex===2){
				//assuming we update user successfully, display result on UI
				let res = "<p>The changes have beed made successfully. Thank you!</p>"; 
				$("#status").html(res);				
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
			
			//hied previous button on Completed Step and disable trigger on Tabs
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
		errorPlacement: function errorPlacement(error, element) { element.before(error); },
		rules: {
			firstName: {
				required: true,
				minlength: 1
			},
			lastName: {
				required: true,
				minlength: 1
			},
			phone: {
				required: true,
				minlength: 10,
				phoneUS: true
			}, 
			email:{
				required: true,
				email: true
			}
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
	
	/*** update selectedUser object when input fields changes***/
	$('#firstName').change(function() { 
		selectedUser.firstName = $(this).val(); 
	});
	
	$('#lastName').change(function() { 
		selectedUser.lastName = $(this).val(); 
	});
	
	$('#phone').change(function() { 
		selectedUser.phone = $(this).val(); 
	});
	
	$('#email').change(function() { 
		selectedUser.email = $(this).val(); 
	});
}

function prefillInputs(obj){
	if(obj === undefined ) {
		return false;
	}
	
	//assigned object values into steps 2 inputs
	$('#ID').val(obj.ID);
	$('#firstName').val(obj.firstName);
	$('#lastName').val(obj.lastName);
	$('#phone').val(obj.phone);
	$('#email').val(obj.email);
	return true;
}

function getUserList(){
	//use dummy data 
	return [
		{
			ID: "1001",
			firstName: "Vickie",
			lastName: "Chen",
			phone: "470-285-5688",
			email: "vickie_tree@hotmail.com"		
		},
		{
			ID: "1002",
			firstName: "Joe",
			lastName: "Don",
			phone: "123-456-7898",
			email: "joedon@hotmail.com"			
		}					
	];	
}