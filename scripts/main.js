// ********************************
// *** CANOE LAKE ***
// *** By JSON BOURN ***
// ********************************

// Main Logic File for Solve Page
// https://gsap.com/docs/v3/Plugins/Draggable/
// https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect


document.addEventListener("DOMContentLoaded", function() { 

  // ********** HOLD, SAVE & LOAD USER PROGRESS **********
    var userProgress = {
    solveCell1: "",
    solveCell2: "",
    solveCell3: "",
    isChapter1Solved: false,
    isChapter2Solved: false,
    isChapter3Solved: false
  }
  // Update User Progress with saved cookie (if it exists)
  try {
    getCookie().then(updateProgress());
  }
  catch {console.log("No progress is saved yet")};


  // ************ GET HTML ELEMENTS & COORDINATES ************

  // Get HTML Button elements
  const resetBtn = $(".reset");
  const solveBtn = $(".solve");
  const chapter1Progress = $(".chapter1Progress");
  const chapter2Progress = $(".chapter2Progress");
  const chapter3Progress = $(".chapter3Progress");

  // Set default offsets for liveSnap
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

  // Query window size to update offsets for mobile
  if (window.innerWidth <= 600) {
  var row1OffsetY = -100;
  var row2OffsetY = -184;
  var row3OffsetY = -268;
  var rowOffset = [row1OffsetY, row2OffsetY, row3OffsetY]
  
  // -- X offset by column
  var col1OffsetX = {
    snap1: 0,
    snap2: 84,
    snap3: 168
  }
  var col2OffsetX = {
    snap1: -84,
    snap2: 0,
    snap3: 84
  }
  var col3OffsetX = {
    snap1: -168,
    snap2: -84,
    snap3: 0
  }
  var colOffset = [col1OffsetX, col2OffsetX, col3OffsetX];
  }

  // ******** SOLUTION OBJECT ********
  const solution = {
    fragment1: "jack-pine",
    fragment2: "empty-cabin",
    fragment3: "woman-weeping",
    fragment4: "campfire",
    fragment5: "bottle",
    fragment6: "lake-splash",
    fragment7: "raised-fists",
    fragment8: "red-canoe",
    fragment9: "oar"
  }

  // ******** LOGIC FOR CARDS ********
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
      this.elem = $("#" + id);
      // Depending on which row / col the card is in, set liveSnap grid differently.
      this.row = row;
      this.col = col;
      // Creating the draggable gsap target
      this.draggable = Draggable.create("#" + id, 
      {
        type: 'x,y',
        bounds: $('html'),
        liveSnap:
        {
        //snaps to the closest point in the array, but only when it's within 15px (new in GSAP 1.20.0 release):
        points: [
          { x: 0, y: 0 },
          { x: colOffset[col].snap1, y: rowOffset[row] },
          { x: colOffset[col].snap2, y: rowOffset[row] },
          { x: colOffset[col].snap3, y: rowOffset[row] }
        ],
        radius: 40
        },
        onClick: function () {
        console.log('clicked');
        },
        onDragStart: function () {
          // Remove css transitions
          gsap.set(this.target, { clearProps: "transition" });
        },
        onDragEnd: function () {
        console.log('drag ended');
          // Reapply css transitions
          gsap.set(this.target, { transition: "1s ease" });
          // $(id).classList.remove("card-selected");
        update(id);
        }
      });
    }
  }

  // Constructors for 9 cards:
  const f1 = new Card("f1", 1, 0);
  const f2 = new Card("f2", 0, 2);
  const f3 = new Card("f3", 2, 2);
  const f4 = new Card("f4", 0, 1);
  const f5 = new Card("f5", 0, 0);
  const f6 = new Card("f6", 1, 1); 
  const f7 = new Card("f7", 1, 2); 
  const f8 = new Card("f8", 2, 0); 
  const f9 = new Card("f9", 2, 1); 
  var cardArray = [f1, f2, f3, f4, f5, f6, f7, f8, f9];


  // ********** UPDATE ON DRAG RELEASE FUNCTION **********
  /**
   * Update() is intended to run on every Drag End of a Card
   * @param {string} id - the id of the card element being updated.
   */
  function update(id) {
  console.log("Running update")
  //the HTML element of the snap card:
  const snapCard = document.getElementById(id);
  const card = snapCard.getBoundingClientRect();
  
  // Get Solve Grid Snap Target Coordinates
  //the HTML element of the targeted snap grid:
  var snapTarget1 = document.getElementById('s1');
  var rect1 = snapTarget1.getBoundingClientRect();
  
  var snapTarget2 = document.getElementById('s2');
  var rect2 = snapTarget2.getBoundingClientRect();
  
  var snapTarget3 = document.getElementById('s3');
  var rect3 = snapTarget3.getBoundingClientRect();
  
  // Coords of the snap grid target:
  var rect1X = rect1.x;
  var rect1Y = rect1.y;
  
  var rect2X = rect2.x;
  var rect2Y = rect2.y;
  
  var rect3X = rect3.x;
  var rect3Y = rect3.y;

  //Print coords of the snap card:
  let cardX = card.x;
  let cardY = card.y;
  // console.log("X coord of snapped card: " + cardX);
  // console.log("Y coord of snapped card: " + cardY);

  // Print Coords of a snap target
  // console.log("X coord of the snap target: " + rect1X);
  // console.log("Y coord of the snap target: " + rect1Y);

  //Check if card is trying to snap to a solve cell location:
  if (rect1X == cardX && rect1Y == cardY) 
  {

    console.log("snapped to target 1");
    userProgress.solveCell1 = id;
    snapCard.classList.add("card-selected");
  }
  else if (rect2X == cardX && rect2Y == cardY)
  {
    console.log("snapped to target 2");
    userProgress.solveCell2 = id;
    snapCard.classList.add("card-selected");
  }
  else if (rect3X == cardX && rect3Y == cardY)
  {
    console.log("snapped to target 3");
    userProgress.solveCell3 = id;
    snapCard.classList.add("card-selected");
  }
  else {
    snapCard.classList.remove("card-selected");
    snapCard.classList.remove("card-correct");
  }

  // Check if 3 fragments are selected to activate Solve Button
  let submission = document.querySelectorAll(".card-selected");
  if (submission.length === 3) {
    solveBtn[0].classList.remove("inactive");
    // console.log(solveBtn);
  }
  else {
    solveBtn[0].classList.add("inactive");
  }

  } // ************ END OF UPDATE FUNCTION ************


  // ************ RESET BUTTON FUNCTION ************
  // Create a function that spreads out the positions of all 9 cards
  function resetCards() {
    cardArray.forEach( (card, i) => {
      // console.log(card.id);
      // Reset card position
      gsap.set(card.draggable[0].target, { clearProps: "x,y" });
      // Remove selected class
      card.elem.removeClass("card-selected");
      card.elem.removeClass("card-correct");
      // console.log(card);
    });
  }

  // ************ SOLVE BUTTON FUNCTION ************
  async function solveChapter() {

  // Check the window path to specify solution logic

  // Source - https://stackoverflow.com/a/16611569
  // Posted by Daniel Aranda, modified by community. See post 'Timeline' for change history
  // Retrieved 2026-04-19, License - CC BY-SA 3.0
  var path = window.location.pathname;
  var page = path.split("/").pop();
  console.log( page );

    // Run solution logic
    try {
      // let answer = document.querySelectorAll(".card-selected");
      // let chapterSubmit = [answer[0].id, answer[1].id, answer[2].id];
      let chapter1 = ["f1", "f2", "f3"];
      let chapter2 = ["f4", "f5", "f6"];
      let chapter3 = ["f7", "f8", "f9"];
      let isCorrect = false;
      // Test 
      // console.log(chapterSubmit);
      // console.log(chapter1);
      console.log(userProgress);

      // Check if the input solves Chapter 1
      if (page == "solve-lake.html" &&
          userProgress.solveCell1 === chapter1[0] &&
          userProgress.solveCell2 === chapter1[1] &&
          userProgress.solveCell3 === chapter1[2]) 
      {
        isCorrect = true;
        userProgress.isChapter1Solved = true;
        chapter1Progress.text("Solved");
        chapter1.forEach(id => {
          $("#"+ id).removeClass("card-selected");
          $("#"+ id).addClass("card-correct");
        });
        $(".fragment-grid").addClass("card-correct");
        showProgress();
        updateProgress();
      }
      // Check if the input solves Chapter 2
      else if (page == "solve-lodge.html" &&
              userProgress.solveCell1 === chapter2[0] &&
              userProgress.solveCell2 === chapter2[1] &&
              userProgress.solveCell3 === chapter2[2]) 
      {
        isCorrect = true;
        userProgress.isChapter2Solved = true;
        chapter2Progress.text("Solved");
        chapter2.forEach(id => {
          $("#"+ id).removeClass("card-selected");
          $("#"+ id).addClass("card-correct");
        });
        $(".fragment-grid").addClass("card-correct");
        showProgress();
        updateProgress();
      }
      // Check if the input solves Chapter 3
      else if (page == "solve-shoreline.html" &&
              userProgress.solveCell1 === chapter3[0] &&
              userProgress.solveCell2 === chapter3[1] &&
              userProgress.solveCell3 === chapter3[2]) 
      {
        isCorrect = true;
        userProgress.isChapter3Solved = true;
        chapter3Progress.text("Solved");
        chapter3.forEach(id => {
          $("#"+ id).removeClass("card-selected");
          $("#"+ id).addClass("card-correct");
        });
        $(".fragment-grid").addClass("card-correct");
        showProgress();
        updateProgress();
      }

      // Check if submitted chapter is correct
      if (isCorrect)
      {
       console.log("Chapter Complete!");
       setCookie(7);

      }
      else {
        console.log("This is not a correct chapter");
      }

      // Check if all Chapters are correct
      if (userProgress.isChapter1Solved &&
          userProgress.isChapter2Solved &&
          userProgress.isChapter3Solved)
      {
        console.log("Congratulations! All Chapters Complete!");
      }

      setCookie();
    }
    catch {
      console.log("3 fragments must be selected to solve.");
    }

  } // END OF SOLVE CHAPTER FUNCTION


  // ********** COOKIE FUNCTIONS **********

  //https://www.w3schools.com/js/js_cookies.asp

  function setCookie(exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie =
    `isChapter1Solved=${userProgress.isChapter1Solved};` + expires + ";path=/";
  document.cookie = 
    `isChapter2Solved=${userProgress.isChapter2Solved};` + expires + ";path=/";
  document.cookie = 
    `isChapter3Solved=${userProgress.isChapter3Solved};` + expires + ";path=/";
  console.log("Saved progress");
  };

  // ASYNC getCookie for performance
  async function getCookie() {
    // https://developer.mozilla.org/en-US/docs/Web/API/CookieStore/get
    savedProgress = await cookieStore.getAll();
    if(savedProgress) {
      savedProgress.forEach(cookie => {
        switch (cookie.name) {
          case "isChapter1Solved":
            userProgress.isChapter1Solved = JSON.parse(cookie.value);
            break;
          case "isChapter2Solved":
            userProgress.isChapter2Solved = JSON.parse(cookie.value);
            break;
          case "isChapter3Solved":
            userProgress.isChapter3Solved = JSON.parse(cookie.value);
            break;
          default:
            break;
        }
      });
      updateProgress();
    }
    else {console.log("cookie not found")};
    console.log(userProgress);
  };

  // SYNC getCookie
  // function getCookie(name) {
  // const value = `; ${document.cookie}`;
  // console.log(value);
  // const parts = value.split(`; ${name}=`);
  // // if (parts.length === 2) return parts.pop().split(';').shift();
  // console.log(parts);
  // }


  // ********** BUTTON FUNCTIONS **********
  
  function showProgress() {
    console.log("progress");
    $("#progress").toggle();
  };

  function closeProgress() {
    console.log("progress");
    $("#progress").hide();
  };

  function updateProgress() {
    if(userProgress.isChapter1Solved === true)
    {
      chapter1Progress.text("Solved");
      $("#h1-lake").text("Solved: The Lake");
      $("#dialog-lake").text("You Solved The Lake!");
      $("#lake-chapter-btn").show();
    }
    if(userProgress.isChapter2Solved === true)
    {
      chapter2Progress.text("Solved");
      $("#h1-lodge").text("Solved: The Lodge");
      $("#dialog-lodge").text("You Solved The Lodge!");
      $("#lodge-chapter-btn").show();

    }
    if(userProgress.isChapter3Solved === true)
    {
      chapter3Progress.text("Solved");
      $("#h1-shoreline").text("Solved: Shoreline");
      $("#dialog-shoreline").text("You Solved Shoreline!");
      $("#shoreline-chapter-btn").show();

    }
    console.log(userProgress);
  }


  // *********** EVENT LISTENERS *************

  // RESET BUTTON
  document.querySelector(".reset").addEventListener("click", () => {
    resetCards();
    solveBtn[0].classList.add("inactive");
  });
  // SOLVE BUTTON
  document.querySelector(".solve").addEventListener("click", () => {
    solveChapter();
  });
  // SHOW PROGRESS BUTTON
  document.querySelector(".progress").addEventListener("click", () => {
    showProgress();
  });
  // CLOSE PROGRESS BUTTON
  document.querySelector("#closeProgress").addEventListener("click", () => {
    closeProgress();
  });
  // // SAVE BUTTON
  // document.querySelector("#makeCookie").addEventListener("click", () => {
  //   setCookie(7);
  // });
  // // LOAD BUTTON
  // document.querySelector("#printCookie").addEventListener("click", () => {
  //   getCookie();
  //   updateProgress();
  // });


}); // END DOM Loaded Function