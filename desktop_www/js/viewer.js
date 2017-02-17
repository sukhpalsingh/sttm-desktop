const platform = require("./js/desktop_scripts");
let currentShabad,
    currentLine;

//IPC
platform.ipc.on("show-line", function(event, data) {
  let stmt = db.get("SELECT gurmukhi, english_ssk, transliteration, sggs_darpan FROM shabad WHERE _id = " + data.lineID, (err, row) => {
    makeSlide([
      $("<h1></h1>").addClass("gurmukhi").text(row.gurmukhi),
      $("<h2></h2>").css("color","#fcf").text(row.english_ssk),
      $("<h2></h2>").css("color","#ffc").text(row.transliteration),
      $("<h2></h2>").css("color","#cff").text(row.sggs_darpan),
    ]);
  });
});

platform.ipc.on("show-text", function(event, data) {
  makeSlide([$("<h1></h1>").addClass("gurmukhi").text(data.text)]);
})

function makeSlide(appendObj) {
  $("#slide").fadeOut(function() {
    $(this).remove();
    let slide = $("<div></div>")
                  .attr("id", "slide");
    for (x = 0; x < appendObj.length; x++) {
      slide.append(appendObj[x]);
    }
    slide.prependTo("body");
  })
}

