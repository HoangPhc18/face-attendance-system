# Liveness Detection Instructions

This module prevents spoofing by detecting whether a face is live.

Techniques used:

- Blink detection
- Head movement tracking
- Depth or texture analysis (if supported)
- CNN-based classification using TensorFlow or PyTorch

Located in: `liveness_detection.py`

If liveness fails, the system will not record the check-in.
