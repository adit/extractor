#!/usr/bin/env node
const { spawn } = require('child_process');
const axios = require('axios');

// init
const config = require('./config.json');
const baseURL = 'https://www.googleapis.com';
const endpoint = '/drive/v3/files';

// config.json validation
for (const key in config) {
  if (!config[key]) {
    console.log(`config.json: ${key} is required!`);
    process.exit(1);
  }
}

// url validation
let userURL = process.argv[2];

if (!userURL.includes('https://drive.google.com/')) {
  console.error('Please enter valid Google Drive link!');
  process.exit(1);
}

if (userURL.includes('https://drive.google.com/file/d/')) {
  userURL = userURL.replace(
    /https:\/\/drive.google.com\/file\/d\/(.*)\/.*/,
    'https://drive.google.com/open?id=$1'
  );
}

const GOOGLE_DRIVE_URL = new URL(userURL);
const fileId = GOOGLE_DRIVE_URL.searchParams.get('id');

if (!fileId) {
  console.error('Please enter valid Google Drive link!');
  process.exit(1);
}

// main app
(async function () {
  try {
    const url = `${baseURL}${endpoint}/${fileId}?key=${config.apiKey}`;
    const result = await axios.get(url);
    execute(url, result.data.name);
  } catch (error) {
    let message = error;

    if (error.response?.status === 404) {
      message = 'File not found!';
    }

    if (error.response?.status === 400) {
      message = 'Your apiKey is invalid!';
    }

    if (error.code === 'ENOTFOUND') {
      message = 'Please check your internet connection!';
    }

    console.log(message);
    process.exit(1);
  }
})();

// execute external binary
function execute(url, name) {
  const args = config.command.split(' ');
  const downloader = spawn(args.shift(), [`${url}&alt=media`, ...args, name], {
    stdio: 'inherit',
  });

  downloader.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}
