# import cv2
# import os
# import numpy as np
# import json
# import requests

# # ================= CONFIG =================
# DATASET_DIR = "faces/students"   # your folder
# MODEL_DIR = "models"
# MODEL_PATH = "models/lbph_model.xml"
# LABELS_PATH = "models/labels.json"

# STUDENT_API = "http://localhost:5000/api/students"

# # Create models dir if missing
# os.makedirs(MODEL_DIR, exist_ok=True)

# face_cascade = cv2.CascadeClassifier(
#     cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
# )

# recognizer = cv2.face.LBPHFaceRecognizer_create()

# faces = []
# labels = []
# label_map = {}
# current_label = 0

# print("📂 Loading dataset...")

# for person_name in os.listdir(DATASET_DIR):
#     person_path = os.path.join(DATASET_DIR, person_name)
#     if not os.path.isdir(person_path):
#         continue

#     label_map[current_label] = person_name

#     # 🔹 SAVE STUDENT TO MONGODB
#     try:
#         payload = {
#             "name": person_name,
#             "studentId": person_name.lower().replace(" ", "_")
#         }

#         requests.post(STUDENT_API, json=payload, timeout=2)
#     except:
#         pass  # ignore if backend is off / already exists

#     for img_name in os.listdir(person_path):
#         img_path = os.path.join(person_path, img_name)
#         img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

#         if img is None:
#             continue

#         detected = face_cascade.detectMultiScale(img, 1.3, 5)

#         for (x, y, w, h) in detected:
#             faces.append(img[y:y+h, x:x+w])
#             labels.append(current_label)

#     current_label += 1

# if len(faces) == 0:
#     print("❌ No faces found")
#     exit()

# print("🧠 Training LBPH model...")
# recognizer.train(faces, np.array(labels))

# recognizer.save(MODEL_PATH)

# with open(LABELS_PATH, "w") as f:
#     json.dump(label_map, f)

# print("✅ Training complete")
# print("📁 Model saved:", MODEL_PATH)
# print("🗂️ Labels saved:", LABELS_PATH)
# print("📦 Students synced to MongoDB")





import cv2
import os
import numpy as np
import pickle
import requests

# ================= CONFIG =================
DATASET_DIR = "faces/students"
MODEL_DIR = "models"
MODEL_PATH = "models/lbph_model.xml"
LABELS_PATH = "models/labels.pkl"

STUDENT_API = "http://localhost:5000/api/students"

os.makedirs(MODEL_DIR, exist_ok=True)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

recognizer = cv2.face.LBPHFaceRecognizer_create()

faces = []
labels = []
label_map = {}
current_label = 0

print("📂 Loading dataset...")

for person_name in sorted(os.listdir(DATASET_DIR)):
    person_path = os.path.join(DATASET_DIR, person_name)
    if not os.path.isdir(person_path):
        continue

    label_map[current_label] = person_name

    # 🔹 Sync student to MongoDB (safe)
    try:
        payload = {
            "name": person_name,
            "studentId": person_name.lower().replace(" ", "_")
        }
        requests.post(STUDENT_API, json=payload, timeout=2)
    except:
        pass

    faces_found_for_person = 0

    for img_name in os.listdir(person_path):
        img_path = os.path.join(person_path, img_name)
        img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)

        if img is None:
            continue

        faces_detected = face_cascade.detectMultiScale(img, 1.2, 4)

        for (x, y, w, h) in faces_detected:
            roi = img[y:y+h, x:x+w]
            roi = cv2.resize(roi, (200, 200))
            faces.append(roi)
            labels.append(current_label)
            faces_found_for_person += 1

    if faces_found_for_person == 0:
        print(f"⚠️ WARNING: No faces were detected in the images for ID {person_name}. They will not be recognized!")

    current_label += 1

if not faces:
    print("❌ No faces found. Training aborted.")
    exit()

print("🧠 Training LBPH model...")
recognizer.train(faces, np.array(labels))

recognizer.save(MODEL_PATH)

with open(LABELS_PATH, "wb") as f:
    pickle.dump(label_map, f)

print("✅ Training complete")
print("📁 Model saved:", MODEL_PATH)
print("🗂️ Labels saved:", LABELS_PATH)
print("📦 Students synced to MongoDB")
