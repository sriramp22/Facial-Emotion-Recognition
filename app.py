import boto3
import os
import io
import base64
from PIL import Image
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template

load_dotenv()
access_key_id = os.environ.get('access_key_id', "")
secret_access_key = os.environ.get('secret_access_key', "")
AWS_region = os.environ.get('AWS_region', 'us-east-1')

rekognition = boto3.client(
    'rekognition',
    aws_access_key_id     = access_key_id,
    aws_secret_access_key = secret_access_key,
    region_name           = AWS_region
)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 20*1024*1024
allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}

def allowed_file(filename: str) -> bool:
    return('.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions)

def convert_image(image_bytes: bytes) -> bytes:
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert('RGB')
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=90)
        return output.getvalue()
    except Exception as e:
        raise ValueError(f'Invalid image file: {str(e)}')
    
def call_rekognition(image_bytes: bytes) -> list:
    try:
        response = rekognition.detect_faces(
            Image = {'Bytes': image_bytes},
            Attributes = ['ALL']
        )
        return response.get('FaceDetails', [])
    except rekognition.exceptions.InvalidImageFormatException:
        raise ValueError('Image could not be processed by Rekognition.')
    except Exception as e:
        raise RuntimeError(f'Amazon Rekognition error: {str(e)}')

def emotion_scores(faces: list) -> dict:
    if not faces:
        return {
            'face_detected': False,
            'dominant': None,
            'confidence': 0,
            'scores': [],
            'description': 'No face was detected in the image provided.',
        }
    face = faces[0]
    aws_emotions = face.get('Emotions', [])
    display_names = {
        'HAPPY':     'Happy',
        'SAD':       'Sad',
        'ANGRY':     'Angry',
        'SURPRISED': 'Surprised',
        'FEAR':      'Fearful',
        'DISGUSTED': 'Disgusted',
        'CALM':      'Calm',
        'CONFUSED':  'Confused',
    }
    emotion_colors = {
        "HAPPY": "#4ade80",   # green
        "SAD":   "#0673fa",   # blue
        "ANGRY":     "#f87171",   # red
        "SURPRISED":  "#fbbf24",   # amber
        "FEAR":      "#a78bfa",   # purple
        "DISGUSTED":   "#34d399",   # teal
        "CALM":   "#9ca3af",   # gray
        "CONFUSED":  "#fb923c",   # orange
    }
    emotion_map = {
        e['Type']: e['Confidence']
        for e in aws_emotions
    }
    scores = []
    for key, name in display_names.items():
        confidence = int(round(emotion_map.get(key, 0.0)))
        scores.append({
            "emotion": name,
            "aws_key":  key,
            "score":   confidence,
            "color":   emotion_colors[key],
        })
    scores.sort(key=lambda x: x['score'], reverse=True)
    total = sum(s['score'] for s in scores)
    
    if total != 100 and scores:
        scores[0]['score'] += 100 - total
    scores.sort(key=lambda x: x['score'], reverse=True)
    dominant = scores[0]['emotion']
    confidence = scores[0]['score']
    
    description = f'The face mainly shows {dominant.lower()} with a confidence level of {confidence}%.'
    if len(scores) > 1 and scores[1]['score']>10:
        second_emotion = scores[1]['emotion'].lower()
        second_score = scores[1]['score']
        description += f' There are also slight hints of {second_emotion} with a confidence level of {second_score}%.'
    return {
        "face_detected": True,
        "dominant":      dominant,
        "confidence":    confidence,
        "scores":        scores,
        "description":   description,
    }
    
    
@app.route('/')
def index():
    return render_template('index.html')

@app.route("/analyze", methods = ["POST"])
def analyze():
    if 'image' in request.files:
        file = request.files['image']
        if file.filename == "":
            return jsonify({'error': 'No file selected.'}), 400
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only JPG, JPEG, PNG and WebP images are supported.'}), 400
        image_bytes = file.read()
    elif request.is_json and 'image' in request.get_json():
        data = request.get_json()
        b64_string = data['image']
        if ',' in b64_string:
            b64_string = b64_string.split(',',1)[1]
        image_bytes = base64.b64decode(b64_string)
    else:
        return jsonify({'error': 'No image provided.'}), 400
    try:
        clean_bytes = convert_image(image_bytes)
        faces = call_rekognition(clean_bytes)
        result = emotion_scores(faces)
        return jsonify(result)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 502
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({'error': 'An unexpected error occured. Try again.'}), 500
    
if __name__ == "__main__":
    #for my own testing
    if not access_key_id:
        print('Access Key ID not set. Check .env file')
    if not secret_access_key:
        print('Secret Access Key not set. Check .env file')
    
    app.run(debug=True, port=5000)