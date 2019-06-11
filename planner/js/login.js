const { default: magister, getSchools } = require("magister.js");
const {BrowserWindow, getCurrentWindow} = require("electron").remote;
const path = require("path");

$(document).ready(function() {
  // autocomplete
  $("#school").on("input focus", async function() {
    if($("#school").val().length < 3) {
      $(".autocomplete").removeClass("show");
      return;
    }

    res = await getSchools($("#school").val());

    $(".autocomplete").html("");
    $(".autocomplete").addClass("show");
    res.forEach((res) => {
      $(".autocomplete").append(`<li>${res.name}</li>`);
    });
    $(".autocomplete > li").click(function() {
      $("#school").val($(this).html());
      $(".autocomplete").removeClass("show");
    });
  });
  $("#school").on("keydown", function(e) {
    if(e.which === 13) {
      if($(".autocomplete > li:nth-child(1)").length !== 0) {
        $("#school").val($(".autocomplete > li:nth-child(1)").html());
        $(".autocomplete").removeClass("show");
      }
    }
  });
  $("#school").on("blur", function(e) {
    setTimeout(() => $(".autocomplete").removeClass("show"), 200);
  });

  // signing in
  $("#login").click(async function() {
    $(".spinner").addClass("spin");
    $("#login, #remember").attr("disabled", true);

    const el = await (async function() {
      let ret = ["#school", "#username", "#password"];
      ret = ret.filter(i => $(i).val().length === 0);
      if(ret.length > 0) return ret;

      const schools = await getSchools($("#school").val());
      if(schools.length !== 1) return ["#school"];

      return await magister({
        school: schools[0],
        username: $("#username").val(),
        password: $("#password").val()
      }).then(async (m) => {

        $("#school, #username, #password").addClass("is-valid");


        if($("#remember").is(":checked")) {
          localStorage.school = $("#school").val();
          localStorage.username = $("#username").val();
          localStorage.password = $("#password").val();
        }


        const win = new BrowserWindow({
          height: 600,
          width: 475,
          resizable: false,
          frame: false,
          webPreferences: {
            nodeIntegration: true
          }
        });

        win.loadFile(path.join(__dirname, "app.html"));

        win.blur();
        window.focus();

        win.webContents.on("did-finish-load", () => {
          win.webContents.send("magister", m.school.name, m.token);
          getCurrentWindow().close();
        });

      }, (err) => {
        if(err.toString().indexOf("username") !== -1) {
          return ["#username"];
        } else if(err.toString().indexOf("password") !== -1) {
          return ["#password"];
        }
      });

      return [];

    })();

    $(".spinner").removeClass("spin");
    $("#login, #remember").attr("disabled", false);

    if(el !== undefined) {
      el.forEach((i) => {
        $(i).addClass("is-invalid");
        $(i).on("input", () => $(i).removeClass("is-invalid"));
      });
    }
  });

  // autosignin
  if(localStorage.username && localStorage.password && localStorage.school) {
    $("#school").val(localStorage.school);
    $("#username").val(localStorage.username);
    $("#password").val(localStorage.password);
    $("#login").trigger("click");
  }
});
