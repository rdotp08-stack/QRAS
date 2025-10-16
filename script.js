// script.js — robust: guards missing DOM, prevents crashes
(function(){
  // safe DOM lookups
  const preview = document.getElementById('preview');
  const scannedName = document.getElementById('scannedName');
  const scannedDate = document.getElementById('scannedDate');
  const scannedTime = document.getElementById('scannedTime');
  const infoBox = document.getElementById('infoBox');
  const switchBtn = document.getElementById('switchCamera');
  const downloadBtn = document.getElementById('downloadLogs');
  const notification = document.getElementById('notification');
  const beep = document.getElementById('beep');

  // small guards
  if (!preview) {
    console.error('Missing <video id="preview"> element.');
    return;
  }

  // instantiate scanner
  let scanner;
  try {
    scanner = new Instascan.Scanner({ video: preview, mirror: false });
  } catch (e) {
    alert('Scanner initialization failed. Check instascan script.');
    console.error(e);
    return;
  }

  let cameras = [];
  let currentCam = 0;
  let lastScan = null;

  function showNotification(msg, ms = 3000) {
    if (!notification) return;
    notification.textContent = msg;
    notification.style.display = 'block';
    clearTimeout(notification._t);
    notification._t = setTimeout(()=>{ notification.style.display = 'none'; }, ms);
  }

  function saveRecord(name) {
    const now = new Date();
    const record = {
      name: name,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString()
    };
    const KEY = 'attendance';
    let arr = [];
    try { arr = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { arr = []; }
    arr.push(record);
    localStorage.setItem(KEY, JSON.stringify(arr));
    return record;
  }

  // scanner listener
  scanner.addListener('scan', function(content) {
    try {
      // prevent immediate duplicates
      if (content === lastScan) return;
      lastScan = content;
      setTimeout(()=> { lastScan = null; }, 1500);

      const rec = saveRecord(content);

      // play sound safely
      try { beep && beep.play().catch(()=>{}); } catch(e){}

      // update UI with fade effect
      if (infoBox) {
        infoBox.style.opacity = '0.25';
      }
      setTimeout(()=> {
        if (scannedName) scannedName.textContent = rec.name || '—';
        if (scannedDate) scannedDate.textContent = rec.date || '—';
        if (scannedTime) scannedTime.textContent = rec.time || '—';
        if (infoBox) infoBox.style.opacity = '1';
      }, 220);

      showNotification('Attendance Recorded Successfully', 3000);
    } catch (err) {
      console.error('Error handling scan:', err);
    }
  });

  // get cameras and start
  Instascan.Camera.getCameras().then(function(cams){
    cameras = cams || [];
    if (cameras.length === 0) {
      alert('No cameras found on this device.');
      return;
    }
    // choose preferred (back) if possible
    const back = cameras.find(c => (c.name || '').toLowerCase().includes('back')) || cameras[0];
    currentCam = cameras.indexOf(back) >= 0 ? cameras.indexOf(back) : 0;
    scanner.start(cameras[currentCam]).catch(e => {
      console.warn('start camera failed, trying default', e);
      scanner.start(cameras[0]).catch(err=>{
        console.error('Could not start camera', err);
      });
    });
  }).catch(err=>{
    console.error('getCameras error:', err);
  });

  // switch camera button
  if (switchBtn) {
    switchBtn.addEventListener('click', () => {
      if (!cameras || cameras.length <= 1) {
        alert('Only one camera detected.');
        return;
      }
      currentCam = (currentCam + 1) % cameras.length;
      scanner.stop().then(()=> {
        scanner.start(cameras[currentCam]).catch(e=>console.error(e));
      }).catch(()=> {
        // try direct start even if stop fails
        scanner.start(cameras[currentCam]).catch(e=>console.error(e));
      });
    });
  }

  // download logs button -> CSV
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const arr = JSON.parse(localStorage.getItem('attendance') || '[]');
      if (!arr || arr.length === 0) {
        showNotification('No attendance data to download', 2500);
        return;
      }
      let csv = 'Name,Date,Time\n';
      arr.forEach(r => {
        // escape commas
        const name = (r.name || '').replace(/"/g, '""');
        csv += `"${name}","${r.date || ''}","${r.time || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance_logs.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showNotification('Download started', 2000);
    });
  }
})();
