/**
 * 	score:
 * 				0 = 5 TIMES
 * 				1 = 4 TIMES
 * 				2 = 3 TIMES
 * 				3 = 2 TIMES
 * 				4 = 1 TIME
 * 				5 = 0 TIMES
 */

 // TODO:  We need view count... eventually scoring will be got it or missed it.
 //        +/- scoring will be used along with the current score to calculate
 //        the viewcount.  We eventually will probably not need the scoring
 //        field.

 // TODO:  When we grab a new list or upload a new list, the list will be ordered
 //        by viewcount / score.  A card will be picked from a window of cards, 
 //        maybe 20~30.  This window itself might have some random width within
//         a range.  After so many cards, we will need to resort the list.  This
//         could be handled with a MOD function based on the current card count.


const maxScore = 5;
const startingViewCount = 5;

var vocabWords;
var numVocabWords;
var flashcard = document.getElementById('flashcard');
var refreshBtn0 = document.getElementsByClassName('refresh')[0];
var refreshBtn1 = document.getElementsByClassName('refresh')[1];
var refreshBtn2 = document.getElementsByClassName('refresh')[2];
var refreshBtn3 = document.getElementsByClassName('refresh')[3];
var refreshBtn4 = document.getElementsByClassName('refresh')[4];
var refreshBtn5 = document.getElementsByClassName('refresh')[5];
var enTitle = document.getElementById('flashcard--title_en');
var noTitle = document.getElementById('flashcard--title_no');
var enContent = document.getElementById('flashcard--content_en');
var noContent = document.getElementById('flashcard--content_no');
var currentCardIdElement = document.getElementById('current-card-id');

///--------------------------------------------------------------
/// Utilities
///--------------------------------------------------------------
function generateGuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	  var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
	  return v.toString(16);
	});
  }

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

  ///--------------------------------------------------------------
  /// Application Behaviors.
  ///--------------------------------------------------------------
  /// The new download feature. 
  function downloadData(){
	
	const filteredVocabWords = this.vocabWords.filter((vocabWord)=>{
		if(vocabWord.score >= maxScore){
			return false;
		}

		// can add additional filtering here.
		return true;
	});

	const downloadDataJson = JSON.stringify(filteredVocabWords);

	const downloadHeaderJson = "data:text/json;charset=utf-8,";
	const downloadContent = downloadHeaderJson + encodeURIComponent(downloadDataJson);
	const downloadFilename = "norsk_engelsk_flash_korter_" + Date.now() + ".json";

	var dlAnchorElem = document.getElementById('downloadAnchorElem');
	dlAnchorElem.setAttribute("href",     downloadContent     );
	dlAnchorElem.setAttribute("download", downloadFilename);
	dlAnchorElem.click();
}

/// Used to convert the google sheets json data to our card data json format.
function extractDataArray(vocabWords){
	var dateNow = Date.now();
	var rightNow = Math.floor( dateNow / 1000);

	const extractedDataArray = vocabWords.map((vocabWord)=>{
		return({
			frontTitle: vocabWord.gsx$entitle.$t,
			frontContent: vocabWord.gsx$en.$t,
			backTitle: vocabWord.gsx$notilte.$t,
			backContent: vocabWord.gsx$no.$t,
			score: 0,
			viewCount: startingViewCount,
			id: generateGuid(),
			parentId: "" 
		})
	})

	return extractedDataArray;
}

function addBackToFrontCards(vocabCards, generateBackToFrontCards){
	const arrayLength = vocabCards.length;
	var dataArray = new Array(arrayLength);
	var counter = 0;

	// Copy current cards to the new array.
	while(counter < arrayLength){
		
			var cardObject = {
				frontTitle: vocabCards[counter].frontTitle,
				frontContent: vocabCards[counter].frontContent,
				backTitle: vocabCards[counter].backTitle,
				backContent: vocabCards[counter].backContent,
				score: vocabCards[counter].score,
				viewCount: vocabCards[counter].viewCount,
				id: vocabCards[counter].id,
				parentId: vocabCards[counter].parentId
			};

			dataArray[counter] = cardObject;
		counter++;
	}

	// generate the flipped cards and add to the new array.
	if(generateBackToFrontCards){
		counter = 0;
		while(counter < arrayLength){
		
			var cardObject = {
				frontTitle: vocabCards[counter].backTitle,
				frontContent: vocabCards[counter].backContent,
				backTitle: vocabCards[counter].frontTitle,
				backContent: vocabCards[counter].frontContent,
				score: vocabCards[counter].score,
				viewCount: startingViewCount,
				id: generateGuid(), 
				parentId: vocabCards[counter].id
			};

			dataArray.push(cardObject);
			counter++;
		}
	}

	return dataArray;
}

// get an initial set of flash cards from an external source.... from google sheets.
//   you can use any google sheet be going into edit mode of the sheet and replacing the link
//   below with the guid like part of the url.
//   https://spreadsheets.google.com/feeds/list/189yHUVdGwxOqVE0Ru92MEN_8GReJXS9XoOWsVcvWVMk/od6/public/values?alt=json
//  TODO:  Add the google sheets edit url so users can see what is being used here.
function getBaseCards(){
	$.getJSON(
		"https://spreadsheets.google.com/feeds/list/189yHUVdGwxOqVE0Ru92MEN_8GReJXS9XoOWsVcvWVMk/od6/public/values?alt=json", 
		function(data) {
			var unshuffledArray = extractDataArray(data.feed.entry);
			var generateBackToFrontCards = document.getElementById("importReverseOfCard").checked;
			var unshuffledBackToFrontVocabWords = addBackToFrontCards(unshuffledArray, generateBackToFrontCards);
			vocabWords = unshuffledBackToFrontVocabWords;

			nextCard();
	});	
}

/// New refresh card functionality
function refreshButtonClick(e,rating){

	var currentCardIdElement = document.getElementById('current-card-id');
	var currentCard = vocabWords.find(cc=>cc.id==currentCardIdElement.textContent);
	currentCard.score = rating;
	currentCard.viewCount = maxScore - currentCard.score; 

	nextCard();

	e.stopPropagation();
	e.preventDefault();
}

function nextCard(){
   
	const remainingCards = vocabWords.filter((vocabWord)=>{
		if(vocabWord.viewCount <= 0){
			return false;
		}

		return true;
	})

	// check to see if we have any remaining cards.
	if(remainingCards.length <= 0){
		alert('There are no remaining cards left.');

		// TODO:  Maybe offer a reset or completion options .

		return;
	}
	
	var numberOfRemainingCards = remainingCards.length;
	var randomNum = getRandomInt(0, numberOfRemainingCards);
	var selectedRemainingCard = remainingCards[randomNum];

	newWord = vocabWords.find(vw=>vw.id == selectedRemainingCard.id);

	$('#flashcard').removeClass('flipped');

	enTitle.textContent = newWord.frontTitle;
	enContent.textContent = newWord.frontContent;
	noTitle.textContent = newWord.backTitle;
	noContent.textContent = newWord.backContent;
	currentCardIdElement.textContent = newWord.id;

}

///--------------------------------------------------------------
/// Event Listeners
///--------------------------------------------------------------
flashcard.addEventListener('click', function() {
	this.classList.toggle('flipped');
}, false);

refreshBtn0.addEventListener('click', function(e) {
	refreshButtonClick(e,0);
}, false);

refreshBtn1.addEventListener('click', function(e) {
	refreshButtonClick(e,1);
}, false);

refreshBtn2.addEventListener('click', function(e) {
	refreshButtonClick(e,2);
}, false);

refreshBtn3.addEventListener('click', function(e) {
	refreshButtonClick(e,3);
}, false);

refreshBtn4.addEventListener('click', function(e) {
	refreshButtonClick(e,4);
}, false);

refreshBtn5.addEventListener('click', function(e) {
	refreshButtonClick(e,5);
}, false);

// Handles importing from a local file.
document.getElementById('import').onclick = function() {
	var files = document.getElementById('selectFiles').files;
  	console.log(files);
	  
	  if (files.length <= 0) { 
    	return false;
  	}
  
	var fr = new FileReader();
	
	fr.onload = function(e) { 
		console.log(e);

		var result = JSON.parse(e.target.result);	
		var generateBackToFrontCards = document.getElementById("importReverseOfCard").checked;
		//var expandedVocabWords = expandDifficultCards(result);

		if(generateBackToFrontCards){
			var backToFrontVocabWords = addBackToFrontCards(result, generateBackToFrontCards);

			const viewCountCreatedVocabWords = backToFrontVocabWords.map((vocabWord)=>{
				vocabWord.viewCount = maxScore - vocabWord.score;
			});

			vocabWords = viewCountCreatedVocabWords;
		}
		
		numVocabWords = vocabWords.length;
		nextCard();

		// Show the contents of the file.
		var formatted = JSON.stringify(result, null, 2);
			document.getElementById('result').value = formatted;
  }
  
  fr.readAsText(files.item(0));
};