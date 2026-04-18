// ********************************
// *** CANOE LAKE ***
// *** By JSON BOURN ***
// ********************************

// Main Logic File for Solve Page

document.addEventListener("DOMContentLoaded", function() { 

  //Get initial x,y of all cards.
  const f1Elem = document.getElementById("f1")
  const f1InitPos = f1Elem.getBoundingClientRect();
  const f1InitX = f1InitPos.x;
  const f1InitY = f1InitPos.y;

  // Set required offsets for liveSnap
  // -- Y offset by row
  var row1OffsetY = -120;
  var row2OffsetY = -230;
  var row3OffsetY = -340;
  var rowOffset = [row1OffsetY, row2OffsetY, row3OffsetY]
  
  // -- X offset by column
  var col1OffsetX = {
    snap1: 0,
    snap2: 110,
    snap3: 220
  }
  var col2OffsetX = {
    snap1: -110,
    snap2: 0,
    snap3: 110
  }
  var col3OffsetX = {
    snap1: -220,
    snap2: -110,
    snap3: 0
  }
  var colOffset = [col1OffsetX, col2OffsetX, col3OffsetX];

  // ******* LOGIC FOR CARDS ********
  /**
   * Card class represents the draggable card elements on the solve page.
   * 
   */
  class Card {
    /**
     * 
     * @param {string} id - the html id of the element.
     * @param {integer} row - the row that the card started in the 9x9 grid.
     * @param {integer} col - the column that the card started in the 9x9 grid.
     */
    constructor(id, row, col) {
      this.id = id;
      // Depending on which row / col the card is in, set liveSnap grid differently.
      this.row = row;
      this.col = col;
      this.draggable = Draggable.create(id, 
      {
        type: 'x,y',
        bounds: $('html'),
        inertia: true,
        liveSnap:
        {
        //snaps to the closest point in the array, but only when it's within 15px (new in GSAP 1.20.0 release):
        points: [
          { x: 0, y: 0 },
          { x: colOffset[col].snap1, y: rowOffset[row] },
          { x: colOffset[col].snap2, y: rowOffset[row] },
          { x: colOffset[col].snap3, y: rowOffset[row] }
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
    }
  }

  // Constructors for 9 cards:
  const f1 = new Card("#f1", 0, 0);
  const f2 = new Card("#f2", 0, 1);
  const f3 = new Card("#f3", 0, 2);
  const f4 = new Card("#f4", 1, 0);
  const f5 = new Card("#f5", 1, 1);
  const f6 = new Card("#f6", 1, 2);
  const f7 = new Card("#f7", 2, 0);
  const f8 = new Card("#f8", 2, 1);
  const f9 = new Card("#f9", 2, 2);

  // ******** UPDATE ON DRAG RELEASE ********

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
  const snapTarget1 = document.getElementById('s1');
  const rect1 = snapTarget1.getBoundingClientRect();
  
  const snapTarget2 = document.getElementById('s2');
  const rect2 = snapTarget2.getBoundingClientRect();
  
  const snapTarget3 = document.getElementById('s3');
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
    // let cardStart = document.querySelector(".card-start");
    // cardStart.style.grid = "1fr 1fr 1fr / 1fr 1fr 1fr";
    console.log(cards);
    // for(let i=0; i < 9; i++){
    //   // cards[i].offsetLeft += i * 100;
    //   cardStart.style.display = "block";
    //   cards[i].style.display = "block";
    //   cards[i].classList.remove("stacked");
    //   cards[i].style.setProperty("transform", `translate3d(0px, ${i * 100}px, 0px)`);
    // }
    cards[0].setAttribute("transform", "translate(100px);");
  }

  document.querySelector(".spread").addEventListener("click", () => {
    spreadCards();
  });

}); // END DOM Loaded Function