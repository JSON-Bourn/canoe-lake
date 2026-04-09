// ********************************
// *** CANOE LAKE ***
// *** By JSON BOURN ***
// ********************************

// Main Logic File for Solve Page

document.addEventListener("DOMContentLoaded", function() {

  gsap.registerPlugin(Draggable) 

  Draggable.create('.draggable', {
    // type: 'y',
    // bounds: document.getElementById('body'),
    inertia: true,
    liveSnap: {
		//snaps to the closest point in the array, but only when it's within 15px (new in GSAP 1.20.0 release):
		points: [
			{ x: 0, y: 0 },
			{ x: 100, y: 0 },
			{ x: 200, y: 50 }
		],
		radius: 15
	  },
    onClick: function () {
    console.log('clicked');
    },
    onDragEnd: function () {
    console.log('drag ended');
    console.log('Running update');
    update();
    }
  });

  //Testing function
  function update() {
  const elem = document.getElementById('snaptarget');
  const rect = elem.getBoundingClientRect();

  for (const key in rect) {
        let data;
        data = `${key} : ${rect[key]}`;
        console.log(data);
    }
  }

  document.addEventListener("click", update);
  update();




});