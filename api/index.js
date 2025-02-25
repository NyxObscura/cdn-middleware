const express = require('express');
const axios = require('axios');

const app = express();

// Konfigurasi
const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN; // Token GitHub dari environment variable
const GITHUB_USERNAME = process.env.USERNAME_GITHUB; // Username GitHub dari environment variable
const REPO_NAME = process.env.REPO_GITHUB; // Nama repository dari environment variable
const BRANCH = process.env.BRANCH_REPO; // Branch yang digunakan dari environment variable
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/`;

// Middleware untuk pretty print JSON
app.set('json spaces', 2); // Format JSON dengan 2 spasi indentasi

// Endpoint untuk mencari file di GitHub
app.get('/media/:filename', async (req, res) => {
  try {
    const filename = req.params.filename; // Nama file yang diminta user
    const filePath = `uploads/${filename}`; // Path file di repo GitHub

    // Cek apakah file ada di GitHub
    const response = await axios.get(GITHUB_API_URL + filePath, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Node.js-Middleware',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 200) {
      // Jika file ditemukan, ambil URL download-nya
      const downloadUrl = response.data.download_url;

      // Teruskan file ke user
      const fileResponse = await axios.get(downloadUrl, { responseType: 'stream' });
      res.setHeader('Content-Type', response.data.type); // Set header sesuai tipe file
      fileResponse.data.pipe(res); // Stream file ke user
    } else {
      // Jika file tidak ditemukan
      res.status(404).json({ error: 'The thing you are looking for is not found.' });
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Jika file tidak ditemukan di GitHub
      res.status(404).json({ error: 'The thing you are looking for is not found.' });
    } else {
      // Jika terjadi error lain
      console.error(error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// Export sebagai Vercel Serverless Function
module.exports = app;
