document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const loadingBanner = document.getElementById('loading');
    const errorBanner = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    const resultContainer = document.getElementById('result-container');
    const asciiOutput = document.getElementById('ascii-output');
    const saveBtn = document.getElementById('save-btn');
    const resetBtn = document.getElementById('reset-btn');
    const testImagesContainer = document.getElementById('test-images');
    const testImages = document.querySelectorAll('.test-image');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const asciiWrapper = document.querySelector('.ascii-wrapper');

    let currentAscii = '';
    let currentZoom = 3;

    // --- FILE SELECTION ---

    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // --- DRAG AND DROP ---

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // --- TEST IMAGES ---

    testImages.forEach(img => {
        img.addEventListener('click', async () => {
            try {
                // Fetch the image as a blob to create a File object
                const response = await fetch(img.src);
                if (!response.ok) throw new Error("Network response was not ok");
                const blob = await response.blob();

                // Get filename from src
                const filename = img.src.split('/').pop() || 'test-image.jpg';
                const file = new File([blob], filename, { type: blob.type });

                handleFile(file);
            } catch (err) {
                showError('FAILED TO LOAD TEST IMAGE');
            }
        });
    });

    // --- API INTERACTION ---

    async function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showError('MUST BE AN IMAGE FILE');
            return;
        }

        // Reset UI state
        errorBanner.classList.add('hidden');
        dropZone.classList.add('hidden');
        if (testImagesContainer) testImagesContainer.classList.add('hidden');
        resultContainer.classList.add('hidden');
        loadingBanner.classList.remove('hidden');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `HTTP ERROR ${response.status}`);
            }

            const data = await response.json();

            if (data.ascii) {
                // The Go backend returns [][]string
                // Join the 2D array into a proper multiline ASCII string
                const asciiString = data.ascii.map(row => row.join('')).join('\n');
                showResult(asciiString);
            } else {
                throw new Error('NO ASCII DATA RETURNED');
            }

        } catch (err) {
            showError(err.message.toUpperCase());
        } finally {
            loadingBanner.classList.add('hidden');
        }
    }

    // --- UI UPDATES ---

    function showResult(ascii) {
        currentAscii = ascii;
        asciiOutput.textContent = ascii;
        currentZoom = 3; // always start zoomed out
        asciiOutput.style.fontSize = `${currentZoom}px`;
        resultContainer.classList.remove('hidden');
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorBanner.classList.remove('hidden');
        dropZone.classList.remove('hidden'); // allow try again immediately
        if (testImagesContainer) testImagesContainer.classList.remove('hidden');
    }

    resetBtn.addEventListener('click', () => {
        resultContainer.classList.add('hidden');
        errorBanner.classList.add('hidden');
        dropZone.classList.remove('hidden');
        if (testImagesContainer) testImagesContainer.classList.remove('hidden');
        fileInput.value = ''; // reset file input
        currentAscii = '';
    });

    // --- ZOOM CONTROLS ---

    zoomInBtn.addEventListener('click', () => {
        currentZoom = Math.min(currentZoom + 1, 30);
        asciiOutput.style.fontSize = `${currentZoom}px`;
    });

    zoomOutBtn.addEventListener('click', () => {
        currentZoom = Math.max(currentZoom - 1, 1);
        asciiOutput.style.fontSize = `${currentZoom}px`;
    });

    asciiWrapper.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
                currentZoom = Math.min(currentZoom + 1, 30);
            } else {
                currentZoom = Math.max(currentZoom - 1, 1);
            }
            asciiOutput.style.fontSize = `${currentZoom}px`;
        }
    });

    // --- SAVE AS PNG ---

    saveBtn.addEventListener('click', () => {
        if (!currentAscii) return;

        // Create an off-screen canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Font settings must match the CSS display relatively closely
        // But we can scale it up for a higher-res output
        const fontSize = 14;
        const fontFamily = 'monospace'; // use standard monospace to ensure consistent width
        const lineHeight = 1.2;

        ctx.font = `${fontSize}px ${fontFamily}`;

        const lines = currentAscii.split('\n');

        // Calculate dimensions
        let maxChars = 0;
        for (const line of lines) {
            if (line.length > maxChars) maxChars = line.length;
        }

        // approximate char width
        const charWidth = ctx.measureText('M').width;

        // padding
        const padding = 40;

        canvas.width = (maxChars * charWidth) + (padding * 2);
        canvas.height = (lines.length * (fontSize * lineHeight)) + (padding * 2);

        // Fill background (Dark mode for the brutalist contrast)
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw text
        ctx.fillStyle = '#ffffff';
        // Reset font after resizing canvas
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textBaseline = 'top';

        for (let i = 0; i < lines.length; i++) {
            // Draw each line
            const y = padding + (i * fontSize * lineHeight);
            ctx.fillText(lines[i], padding, y);
        }

        // Trigger Download
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `brutal-ascii-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});
