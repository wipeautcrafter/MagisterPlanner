const { default: magister, getSchools } = require("magister.js");
let session = null;

const {ipcRenderer} = require('electron');

const connect = async () => {
  const schools = await getSchools(sessionStorage.school);
  const school = schools[0];

  const token = sessionStorage.token;

  session = await magister({
    school,
    token
  });

  $(".loader").remove();
};

ipcRenderer.on("magister", async (event, name, token) => {
  sessionStorage.school = name;
  sessionStorage.token = token;

  await connect();
});

$(document).ready(() => {
  if(sessionStorage.school !== undefined && sessionStorage.token !== undefined) connect();
  
  $(".expand-btn").click(function() {
    $(this).toggleClass("expand");
  });
});
