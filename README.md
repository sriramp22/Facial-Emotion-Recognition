# Facial Emotion Recognition

A computer vision web application that detects and analyzes facial emotions 
in real time using Amazon Rekognition and Flask. Users can either upload a 
photo or use their live webcam to identify emotions with confidence percentages 
displayed as color-coded bars.

---

## Demo

Upload Mode — upload any photo containing a face and the app will analyze it instantly.
Webcam Mode — start your camera, capture a frame, and get real-time emotion analysis.

---

## Features

- Upload a photo (JPG, PNG, WebP) for emotion analysis
- Live webcam capture and analysis
- Detects 8 emotions: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Calm, Confused
- Displays each emotion with a confidence percentage and color-coded bar
- Shows dominant emotion with a highlighted badge
- Natural language description of the detected emotional expression
- Drag and drop image support
- Responsive design that works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Flask |
| AI / Emotion Detection | Amazon Rekognition |
| Image Processing | Pillow (PIL) |
| Frontend | HTML, CSS, JavaScript |
| Environment Management | python-dotenv |
| AWS SDK | boto3 |

---

## Project Structure
Facial-Emotion-Recognition/
├── app.py                 ← Flask backend — handles routing and API calls
├── requirements.txt       ← Python dependencies
├── .env.example           ← Template for environment variables
├── templates/
│   └── index.html         ← Main web page
└── static/
├── style.css          ← Styling and dark theme
└── script.js          ← Frontend logic (webcam, upload, rendering)

---

## How It Works

1. The user uploads a photo or captures a webcam frame
2. The image is sent to the Flask backend via a POST request
3. Flask validates and converts the image to JPEG using Pillow
4. The image bytes are sent to Amazon Rekognition's detect_faces API
5. Rekognition returns emotion confidence scores for each detected face
6. Flask parses the scores and returns them as JSON
7. The browser renders the results as percentage bars with color coding

## Setup and Installation

### 1. Clone the repository
```bash
git clone https://github.com/sriramp22/Facial-Emotion-Recognition.git
cd Facial-Emotion-Recognition
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Set up AWS credentials
Copy the environment variable template:
```bash
cp .env.example .env
```

Open `.env` and fill in your AWS credentials:
access_key_id=your_aws_access_key_here
secret_access_key=your_aws_secret_key_here
AWS_region=us-east-1

### 4. Run the application
```bash
python app.py
```

### 5. Open in browser
http://localhost:5000

---

## Usage

### Upload Photo Mode
1. Click **Upload Photo** tab
2. Click the upload area or drag and drop an image
3. Click **Analyze Emotion**
4. View the emotion breakdown on the right panel

### Webcam Mode
1. Click **Use Webcam** tab
2. Click **Start Camera** and allow camera access
3. Click **Capture & Analyze** when ready
4. View the emotion breakdown on the right panel

---

## Emotions Detected

| Emotion | Color |
|---|---|
| Happy | Green |
| Sad | Blue |
| Angry | Red |
| Surprised | Amber |
| Fearful | Purple |
| Disgusted | Teal |
| Calm | Gray |
| Confused | Orange |
