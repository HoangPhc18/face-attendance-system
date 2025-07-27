# Face Recognition Instructions

This module handles facial recognition using:

- OpenCV (for image capture and preprocessing)
- FaceNet or MTCNN (for embedding extraction)

Main tasks:

- Capture face from webcam
- Encode face as a 128D vector
- Match with stored embeddings
- Confirm identity with high confidence threshold

New employees are enrolled by capturing and saving embeddings.

Located in: `face_recognition.py`
