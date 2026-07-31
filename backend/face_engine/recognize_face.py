
import cv2
import numpy as np
import base64
import pickle
import sys
import os
import json

# ================= CONFIG =================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "models", "lbph_model.xml")
LABELS_PATH = os.path.join(BASE_DIR, "models", "labels.pkl")
CASCADE_PATH = os.path.join(BASE_DIR, "models", "haarcascade_frontalface_default.xml")

CONFIDENCE_THRESHOLD = 90  # LBPH: lower = better match. 90 allows for real-world lighting variation.


# ================= LOAD MODELS =================

try:
    face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(MODEL_PATH)

    with open(LABELS_PATH, "rb") as f:
        LABELS = pickle.load(f)

except Exception as e:
    print(json.dumps({"faces": [], "error": str(e)}))
    sys.exit()


# ================= READ INPUT FROM NODE =================

try:
    image_base64 = sys.stdin.read()

    if not image_base64:
        print(json.dumps({"faces": []}))
        sys.exit()

    # Remove base64 header if exists
    if "," in image_base64:
        image_base64 = image_base64.split(",")[-1]

    img_bytes = base64.b64decode(image_base64)
    img_array = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if frame is None:
        print(json.dumps({"faces": []}))
        sys.exit()

except Exception as e:
    print(json.dumps({"faces": [], "error": str(e)}))
    sys.exit()


# ================= FACE DETECTION =================

try:
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_cascade.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=5,
        minSize=(80, 80)
    )

    results = []

    for (x, y, w, h) in faces:
        roi = gray[y:y+h, x:x+w]
        roi = cv2.resize(roi, (200, 200))

        label_id, confidence = recognizer.predict(roi)

        name = LABELS.get(label_id, "Unknown")

        # Debug: print to stderr so it shows in Node.js backend console
        print(f"[FACE DEBUG] label_id={label_id}, name={name}, confidence={confidence:.2f}, threshold={CONFIDENCE_THRESHOLD}", file=sys.stderr)

        if confidence > CONFIDENCE_THRESHOLD:
            name = "Unknown"

        results.append({
            "name": name,
            "bbox": [int(x), int(y), int(w), int(h)],
            "score": round(float(confidence), 2)
        })

    print(json.dumps({"faces": results}))

except Exception as e:
    print(json.dumps({"faces": [], "error": str(e)}))
