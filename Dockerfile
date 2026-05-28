# Backend image: Express server + Python/spaCy scene parser.
# Deploy this on Render / Railway / Fly.io (Vercel hosts the frontend separately).
FROM node:20-slim

# System Python for the spaCy-based scene parser
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Isolated Python environment (avoids Debian's externally-managed system packages).
# Putting the venv first on PATH means the server's spawn("python3") uses it too.
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Python dependencies + spaCy English model
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt \
  && python -m spacy download en_core_web_sm

# Node dependencies (express, cors, dotenv, replicate, ...)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Backend source
COPY server ./server

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/index.js"]
