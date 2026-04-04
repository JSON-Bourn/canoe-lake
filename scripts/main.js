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
    onClick: function () {
    console.log('clicked');
    },
    onDragEnd: function () {
    console.log('drag ended');
    }
  });

});