from face_attendance import encode_face, match_face
import numpy as np
import json
import cv2

def load_known_embeddings():
    # Giả sử bạn đã có file lưu danh sách khuôn mặt người dùng (demo)
    with open("test_faces.json", "r") as f:
        data = json.load(f)
    names = list(data.keys())
    embeddings = [np.array(v) for v in data.values()]
    return names, embeddings

if __name__ == "__main__":
    names, known_embeddings = load_known_embeddings()
    
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        print("❌ Không thể mở webcam.")
        exit()

    try:
        encoding = encode_face(frame)
        idx, confidence = match_face(encoding, known_embeddings, threshold=0.5)
        if idx is not None:
            print(f"✅ Khuôn mặt khớp với: {names[idx]} (confidence: {confidence:.2f})")
        else:
            print("❌ Không tìm thấy khuôn mặt khớp.")
    except Exception as e:
        print("❌ Lỗi:", e)
