let scanner = new Instascan.Scanner({ video: document.getElementById('preview'), mirror: false });
let cameras = [];
let currentCam = 0;
const infoBox = document.getElementById('infoBox');

scanner.addListener('scan', function (content) {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  const record = { name: content, date, time };

  // save record
  let records = JSON.parse(localStorage.getItem('attendance')) || [];
  records.push(record);
  localStorage.setItem('attendance', JSON.stringify(records));

  // beep and notify
  document.getElementById('beep').play();
  showNotification("Attendance Recorded Successfully");

  // update display with fade
  infoBox.classList.add('fade');
  setTimeout(() => {
    document.getElementById('scannedName').textContent = record.name;
    document.getElementById('scannedDate').textContent = record.date;
    document.getElementById('scannedTime').textContent = record.time;
    infoBox.classList.remove('fade');
  }, 300);
});

Instascan.Camera.getCameras().then(function (cams) {
  cameras = cams;
  if (cameras.length > 0) {
    let backCam = cameras.find(c => c.name.toLowerCase().includes('back')) || cameras[0];
    scanner.start(backCam);
  } else {
    alert('No cameras found.');
  }
});

document.getElementById('switchCamera').addEventListener('click', () => {
  if (cameras.length > 1) {
    currentCam = (currentCam + 1) % cameras.length;
    scanner.start(cameras[currentCam]);
  } else {
    alert('Only one camera detected.');
  }
});

function showNotification(msg) {
  const note = document.getElementById('notification');
  note.textContent = msg;
  note.style.display = 'block';
  setTimeout(() => note.style.display = 'none', 3000);
}
