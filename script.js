let scanner = new Instascan.Scanner({ video: document.getElementById('preview'), mirror: false });
let cameras = [];
let currentCam = 0;

scanner.addListener('scan', function (content) {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  const record = { name: content, date, time };

  // save record
  let records = JSON.parse(localStorage.getItem('attendance')) || [];
  records.push(record);
  localStorage.setItem('attendance', JSON.stringify(records));

  // beep sound
  document.getElementById('beep').play();

  // notification
  showNotification("Attendance Recorded Successfully");
});

Instascan.Camera.getCameras().then(function (cams) {
  cameras = cams;
  if (cameras.length > 0) {
    // Prefer back camera if available
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
