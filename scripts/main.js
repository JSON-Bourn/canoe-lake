// ********************************
// *** CANOE LAKE ***
// *** By JSON BOURN ***
// ********************************

// Main Logic File for Solve Page

document.addEventListener("DOMContentLoaded", function() { 

  //Get initial x,y of all cards.
  const f1 = document.getElementById("f1")
  const cardStart = f1.getBoundingClientRect();
  const cardStartX = cardStart.x;
  const cardStartY = cardStart.y;

  Draggable.create('.draggable', {
    type: 'x,y',
    bounds: $('html'),
    inertia: true,
    liveSnap:
    {
		//snaps to the closest point in the array, but only when it's within 15px (new in GSAP 1.20.0 release):
		points: [
			{ x: 0, y: 0 },
			{ x: 10, y: -110 },
			{ x: 115, y: -110 },
			{ x: 220, y: -110 }
		],
		radius: 20
	  },
    onClick: function () {
    console.log('clicked');
    },
    onDragEnd: function () {
    console.log('drag ended');
    update();
    }
  });

  //Testing function
  //https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
  function update() {
  console.log("Running update")
  //the HTML element of the snap card:
  const snapCard = document.getElementById('f9');
  const card = snapCard.getBoundingClientRect();
  
  //Print coords of the snap card:
  let cardX = card.x;
  let cardY = card.y;
  console.log("X coord of snapped card: " + cardX);
  console.log("Y coord of snapped card: " + cardY);
  
  //the HTML element of the targeted snap grid:
  const snapTarget1 = document.getElementById('g1');
  const rect1 = snapTarget1.getBoundingClientRect();
  
  const snapTarget2 = document.getElementById('g2');
  const rect2 = snapTarget2.getBoundingClientRect();
  
  const snapTarget3 = document.getElementById('g3');
  const rect3 = snapTarget3.getBoundingClientRect();
  
  // Coords of the snap grid target:
  let rect1X = rect1.x;
  let rect1Y = rect1.y;
  
  let rect2X = rect2.x;
  let rect2Y = rect2.y;
  
  let rect3X = rect3.x;
  let rect3Y = rect3.y;

  // Print Coords of a snap target
  console.log("X coord of the snap target: " + rect1X);
  console.log("Y coord of the snap target: " + rect1Y);

  // Test function
  // for (const key in rect) {
  //     let data;
  //     data = `${key} : ${rect[key]}`;
  //     console.log(data);
  //   }

  //Check if card is snapped in a snap box:
  if (rect1X == cardX && rect1Y == cardY ||
      rect2X == cardX && rect2Y == cardY ||
      rect3X == cardX && rect2Y == cardY) 
  {
    console.log("snapped to a target!");
  }

  } // *********** END OF UPDATE FUNCTION ***********

  // Create a function that spreads out the positions of all 9 cards
  function spreadCards() {
    let cards = document.querySelectorAll(".draggable");
    let cardStart = document.querySelector(".card-start");
    // cardStart.style.grid = "1fr 1fr 1fr / 1fr 1fr 1fr";
    console.log(cards);
    for(let i=0; i < 9; i++){
      // cards[i].offsetLeft += i * 100;
      // cards[i].style.grid = "1fr"
      cards[i].classList.remove("stacked");
    }
  }

  // document.querySelector(".spread").addEventListener("click", () => {
  //   spreadCards();
  // });

}); // END DOM Loaded Function