const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const useragent = require('express-useragent'); // Tambahkan pustaka ini

const app = express();
const PORT = 3000;

// Konfigurasi Cloudflare (Pindahkan ke Variabel Lingkungan untuk produksi!)
const CLOUDFLARE_ZONE = "8986c21d4df43f0d1708b8f9f6ab4dcd";
const CLOUDFLARE_API_TOKEN = "FUKXUphvvUDKUQW8v8JIWXBQekynFNOV1ltmT4eE";
const CLOUDFLARE_TLD = "wanzofc.us.kg";

// Konfigurasi multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 248 * 1024 * 1024 }
});

app.use(express.static(__dirname));
app.use(express.json()); // Untuk mengurai body JSON
app.use(express.urlencoded({ extended: true })); // Untuk mengurai body yang di-encode dalam URL
app.use(useragent.express()); // Tambahkan middleware useragent

// Endpoint untuk mengunggah file
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
        }

        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname || 'image.jpg';
        const fileExtension = originalFileName.split('.').pop();
        const customFileName = `wanz-${uuidv4()}.${fileExtension}`;
        const formData = new FormData();
        formData.append('images', fileBuffer, originalFileName);


        const uploadURL = 'https://telegraph.zorner.men/upload';
        const response = await fetch(uploadURL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            } catch (jsonError) {
                errorBody = await response.text();
            }
            const errorMessage = `Upload gagal dengan status ${response.status}: ${errorBody}`;
            console.error("Upload gagal dengan status:", response.status, "dan pesan:", errorBody);
            return res.status(response.status).json({ error: errorMessage });
        }

        const result = await response.json();
        if (result && result.src) {
            const originalUrl = result.src;
            const baseURL = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);
            const customUrl = `${baseURL}${customFileName}`;

            try {
                const subdomainName = req.body.subdomain || `wanz-${uuidv4()}`;
                const ipAddress = req.body.ip || "103.226.128.118"; // Ambil IP dari request atau gunakan default
                const subdomainResult = await subDomain1(subdomainName, ipAddress);
                if(subdomainResult.success){
                    res.json({ ...result, src: customUrl, subdomain: subdomainResult.name });
                }else{
                    return res.status(500).json({ error: 'Upload berhasil, tetapi gagal membuat subdomain Cloudflare: '+ subdomainResult.error });
                }

            } catch (cloudflareError) {
                console.error("Gagal membuat subdomain Cloudflare:", cloudflareError);
                return res.status(500).json({ error: 'Upload berhasil, tetapi gagal membuat subdomain Cloudflare.' });
            }

        } else {
            res.json(result);
        }
    } catch (error) {
        console.error("Error saat mengunggah:", error);
        res.status(500).json({ error: 'Terjadi kesalahan server saat mengunggah file. Mohon coba lagi nanti.' });
    }
});

// Fungsi untuk membuat subdomain di Cloudflare
function subDomain1(host, ip) {
    // ... (Fungsi ini tetap sama) ...
}

// Endpoint API untuk permintaan GET
app.get('/api/data', (req, res) => {
    const apiData = {
        message: 'Ini adalah data dari server Anda!',
        timestamp: new Date()
    };
    res.json(apiData);
});

// Endpoint API untuk permintaan POST
app.post('/api/data', (req, res) => {
    const receivedData = req.body;

    if (!receivedData) {
        return res.status(400).json({ error: 'Tidak ada data yang diterima.' });
    }

    console.log('Data yang diterima dari permintaan POST:', receivedData);

    res.json({
        message: 'Data diterima dan diproses!',
        receivedData: receivedData
    });
});

// Endpoint utama untuk mengirim index.html dan mencatat informasi pengguna
app.get('/', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const source = req.useragent;

    console.log('------------------------------');
    console.log('Pengguna mengakses halaman web:');
    console.log('IP:', ip);

    if (source) {
        console.log('Browser:', source.browser);
        console.log('Versi:', source.version);
        console.log('OS:', source.os);
        console.log('Platform:', source.platform);
        console.log('Apakah ponsel?', source.isMobile ? 'Ya' : 'Tidak');
        console.log('Apakah desktop?', source.isDesktop ? 'Ya' : 'Tidak');
    } else {
        console.log('Informasi agen pengguna tidak tersedia.');
    }

    // Mendapatkan lokasi menggunakan API eksternal (misalnya, ip-api.com)
    axios.get(`http://ip-api.com/json/${ip}`)
        .then(response => {
            const location = response.data;
            console.log('Lokasi:');
            console.log('- Negara:', location.country);
            console.log('- Kota:', location.city);
            console.log('- Koordinat:', location.lat, location.lon);
            console.log('- ISP:', location.isp);
        })
        .catch(error => {
            console.error('Gagal mendapatkan lokasi:', error.message);
        });

    console.log('------------------------------');

    res.sendFile(path.join(__dirname, 'index.html'));
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
