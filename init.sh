#!/bin/sh
node rabbitMQ/worker.js &
npm run start &
md-seed run
