const { default: magister, getSchools } = require("magister.js");
const {BrowserWindow, getCurrentWindow, shell, Tray, Menu, screen} = require("electron").remote;
const { addDays, getLastMonday, monthString, weekDay } = require("./js/helpers.js");
const path = require("path");
let session = null;

const {ipcRenderer} = require('electron');
const {app} = require("electron").remote;

let calendarWeek = getLastMonday();

// HIDE TO TRAY

let tray = null;

window.toTray = () => {
  if(tray !== null) {
    tray.destroy();
    tray = null;

    getCurrentWindow().show();
    getCurrentWindow().focus();

    return;
  }

  tray = new Tray(path.join(__dirname, "img", "logo.png"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click () {
        window.toTray();
      }
    },
    {
      label: 'Exit',
      click () {
        getCurrentWindow().close();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("click", function() {
    window.toTray();
  });

  getCurrentWindow().hide();
};

// CONNECTING
const connect = async () => {
  try {
    const schools = await getSchools(sessionStorage.school);
    const school = schools[0];

    const token = sessionStorage.token;

    session = await magister({
      school,
      token
    });
  } catch(err) {
    const win = new BrowserWindow({
      height: 500,
      width: 350,
      resizable: false,
      frame: false,
      webPreferences: {
        nodeIntegration: true
      }
    });

    win.loadFile(path.join(__dirname, "login.html"));
    getCurrentWindow().close();
  }

  $(".loader").hide();
  renderDay(new Date());
};

// UI FUNCTIONALITY RENDERING
const renderDay = (day) => {
  $(".scale-days > li > a").tooltip("dispose");
  $(".scale-days").html("");

  $(`<li class="page-item"><a class="page-link" href="#">&laquo;</a></li>`).appendTo(".scale-days").click(() => npWeek(-1));

  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((label, i) => {
    const thisDay = addDays(calendarWeek, i);

    $(`<li class="page-item"><a class="page-link" href="#" data-placement="bottom" title="${thisDay.getDate()} ${monthString(thisDay)}">${label}</a></li>`).appendTo(".scale-days").children().each(function() {
      $(this).tooltip();
      $(this).on("click", function() {
        renderDay(thisDay);
      });
    });
  });

  $(`<li class="page-item"><a class="page-link" href="#">&#8962;</a></li>`).appendTo(".scale-days").click(() => {
    calendarWeek = getLastMonday();
    renderDay(new Date());
  });
  $(`<li class="page-item"><a class="page-link" href="#">&raquo;</a></li>`).appendTo(".scale-days").click(() => npWeek(1));

  $(".scale-days > li").eq(weekDay(day) - weekDay(calendarWeek) + 1).addClass("active").children("a").html(day.getDate());

  renderAppointments(day);
};

const npWeek = (np) => {
  calendarWeek = addDays(calendarWeek, np * 7);
  renderDay(calendarWeek);
};

const renderAppointments = async (day) => {
  $(".loader").show();

  const appointments = await session.appointments(day);

  $(".hw-badge").popover("hide");
  $("#schedule-body").html(appointments.length > 0 ? "" : `<tr><td></td><td>It seems like you are free...</td><td></td></tr>`);

  appointments.forEach((i) => {
    if(i.isCancelled) return;

    let badges = [];
    let fullTimeString = "Entire Day";

    let description = i.description + " " + (i.location.length > 0 ? "("+i.location+")" : "");
    let rowCol = "";

    const type = i.infoType;

    if(type === "homework") badges.push(`<span class="badge badge-${i.isDone ? "success" : "secondary"} hw-badge">HW</span>`);
    if(type === "test") badges.push(`<span class="badge badge-${i.isDone ? "success" : "danger"} hw-badge">PW</span>`);
    if(type === "exam") badges.push(`<span class="badge badge-${i.isDone ? "success" : "danger"} hw-badge">TT</span>`);
    if(type === "written exam") badges.push(`<span class="badge badge-${i.isDone ? "success" : "primary"} hw-badge">SO</span>`);
    if(type === "oral exam") badges.push(`<span class="badge badge-${i.isDone ? "success" : "primary"} hw-badge">MO</span>`);
    if(type === "oral exam" || type == "note") badges.push(`<span class="badge badge-${i.isDone ? "success" : "info"} hw-badge">I</span>`);


    if(!i.isFullDay) {
      const hour = i.startBySchoolhour + (i.startBySchoolhour !== i.endBySchoolhour ? " - " + i.endBySchoolhour : "");
      const time = i.start.toTimeString().split(' ')[0].substring(0, 5) + " - " + i.end.toTimeString().split(' ')[0].substring(0, 5);
      fullTimeString = `<span class="badge badge-pill badge-dark">${hour}</span> ${time}`;
    }

    const status = i.status;

    if(status === "changed" || status === "moved" || status === "changed and moved") rowCol = "table-dark";

    $(`<tr class=${rowCol}><td>${fullTimeString}</td><td>${description}</td><td>${badges.join(" ")}</td></tr>`).appendTo("#schedule-body").find(".hw-badge").each(function() {
      $(this).popover({
        container: ".schedule-wrapper",
        title: $(this).html(),
        content: i.content,
        html: true
      });
      $(this).mousedown(async function(e) {
        $(".hw-badge").not(this).popover("hide");

        if(e.which === 3) {
          $(".hw-badge").popover("hide");
          i.isDone = !i.isDone;
          $(".loader").show();
          await i.saveChanges();
          renderDay(day);
        }
      });
    });
  });

  $(".loader").hide();
};

ipcRenderer.on("magister", async (event, name, token) => {
  sessionStorage.school = name;
  sessionStorage.token = token;

  await connect();
});

$(document).ready(() => {
  if(sessionStorage.school !== undefined && sessionStorage.token !== undefined) connect();

  $(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
  });

  $(".hamburger-btn").click(function() {
    $(this).toggleClass("expand");
  });
});
