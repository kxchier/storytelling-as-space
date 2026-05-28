# Backend image: Express server + Python/spaCy scene parser.
# Deploy this on Render / Railway / Fly.io (Vercel hosts the frontend separately).
FROM node:20-slim

# System Python for the spaCy-based scene parser
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Node dependencies (express, cors, dotenv, replicate, ...)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Python dependencies + spaCy English model
COPY server/requirements.txt ./server/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r server/requirements.txt \
  && python3 -m spacy download en_core_web_sm

# Backend source
COPY server ./server

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/index.js"]
