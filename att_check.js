const video = document.getElementById('qr-video');
const canvas = document.createElement('canvas');
const statusDiv = document.getElementById('status');
const context = canvas.getContext('2d');
const modal = document.getElementById('scanModal');
const modalText = document.getElementById('modalText');
let isScanning = true;
let lastScannedCode = null;

function startVideo() {
    navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
    })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        requestAnimationFrame(scanQRCode);
    })
    .catch(err => {
        console.error("카메라 접근 오류:", err);
        statusDiv.textContent = "카메라 접근 오류: " + err;
    });
}

function scanQRCode() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = 300;
        canvas.height = 300;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
            if (code.data && code.data !== lastScannedCode) {
                console.log("QR 코드 발견:", code.data);
                
                if (code.data.includes(',')) {
                    lastScannedCode = code.data;
                    showModal(code.data);
                    isScanning = false;
                    sendToGoogleSheets(code.data);
                }
            }
        }
    }
    if (isScanning) {
        requestAnimationFrame(scanQRCode);
    }
}

function showModal(data) {
    modalText.textContent = `전송 내용:\n${data}`;
    modal.style.display = 'block';
    playDoneSound();
    
    setTimeout(() => {
        modal.style.display = 'none';
        resetScanner();
    }, 3000);
}

function resetScanner() {
    isScanning = true;
    lastScannedCode = null;
    statusDiv.textContent = 'QR 코드를 스캔 영역 안에 위치시켜주세요';
    requestAnimationFrame(scanQRCode);
}

function sendToGoogleSheets(data) {
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwcw8DF9LO6gpH1PjZMeQ1W_j8zCoQJD8-agUmjbA7ET4y_8FmMxo71ijmU80Szkk2q_w/exec';
    
    const params = {
        text: data
    };
    
    const queryString = `text=${encodeURIComponent(params.text)}`;
            
    fetch(`${GOOGLE_SCRIPT_URL}?${queryString}`, {
        method: 'GET',
        mode: 'no-cors'
    })
    .then(() => {
        statusDiv.textContent = 'QR 코드 데이터가 성공적으로 전송되었습니다!';
        setTimeout(() => {
            statusDiv.textContent = 'QR 코드를 스캔 영역 안에 위치시켜주세요';
        }, 2000);
    })
    .catch(error => {
        console.error('전송 오류:', error);
        statusDiv.textContent = '데이터 전송 중 오류가 발생했습니다.';
    });
}

function playDoneSound() {
    const doneSound = document.getElementById('doneSound');
    doneSound.currentTime = 0;
    doneSound.play()
        .catch(error => {
            console.log('오디오 재생 실패:', error);
        });
}

video.addEventListener('play', () => {
    requestAnimationFrame(scanQRCode);
});

window.onload = startVideo;
